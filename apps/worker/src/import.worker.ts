/**
 * AIWA v2 - Catalog Import Worker
 *
 * Imports catalog products from Excel (.xlsx/.xls) or CSV files into PostgreSQL.
 * Parses SKU, Name, Price, Tiered Discounts, Coefficient, Category, Unit, and Relations.
 */

import { Worker, type Job, Queue } from 'bullmq';
import IORedis from 'ioredis';
import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import { readFileSync, existsSync } from 'node:fs';
import { query, withTenantTx } from '@aiwa/db';
import { parseTiers } from '@aiwa/core';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface ImportJobData {
  importId: string;
  tenantId: string;
  filePath?: string;
  fileBufferBase64?: string;
  filename: string;
}

interface ParsedRow {
  sku: string;
  name: string;
  price: number;
  tierRaw: string | null;
  tiers: any[];
  coefficient: number;
  category: string | null;
  unit: string;
  description: string | null;
  relatedRaw: string | null;
}

export function startImportWorker(redis: IORedis): Worker<ImportJobData> {
  const enrichQueue = new Queue('catalog.enrich', { connection: redis });

  const worker = new Worker<ImportJobData>(
    'catalog.import',
    async (job: Job<ImportJobData>) => {
      const { importId, tenantId, filePath, fileBufferBase64, filename } = job.data;
      const log = logger.child({ importId, tenantId, filename });

      log.info('Starting catalog import...');

      // Update import status to validating
      await query(
        `UPDATE catalog_imports SET status = 'validating', started_at = NOW() WHERE id = $1`,
        [importId]
      );

      let buffer: Buffer;
      if (fileBufferBase64) {
        buffer = Buffer.from(fileBufferBase64, 'base64');
      } else if (filePath && existsSync(filePath)) {
        buffer = readFileSync(filePath);
      } else {
        throw new Error('File data not provided or file does not exist');
      }

      // Parse file
      const rawRows: Record<string, any>[] = [];
      const ext = filename.toLowerCase().split('.').pop();

      if (ext === 'csv') {
        const records = parse(buffer, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
        rawRows.push(...records);
      } else {
        // Excel (.xlsx, .xls)
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('Worksheet tidak ditemukan dalam file Excel');

        const headers: string[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
              headers[colNumber] = String(cell.value || '').trim().toLowerCase();
            });
          } else {
            const rowData: Record<string, any> = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber];
              if (header) {
                rowData[header] = cell.value;
              }
            });
            if (Object.keys(rowData).length > 0) {
              rawRows.push(rowData);
            }
          }
        });
      }

      const totalRows = rawRows.length;
      log.info({ totalRows }, 'Parsed raw rows from file');

      await query(
        `UPDATE catalog_imports SET status = 'importing', total_rows = $2 WHERE id = $1`,
        [importId, totalRows]
      );

      // Process and validate rows
      const validRows: ParsedRow[] = [];
      const errors: { row: number; sku?: string; error: string }[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const r = rawRows[i];
        const rowNum = i + 2; // +1 for 0-index, +1 for header

        // Field mapping helpers (case/alias insensitive)
        const getField = (...keys: string[]) => {
          for (const key of keys) {
            const found = Object.keys(r).find((k) => k.toLowerCase() === key.toLowerCase());
            if (found && r[found] !== undefined && r[found] !== null && r[found] !== '') {
              return String(r[found]).trim();
            }
          }
          return null;
        };

        const sku = getField('sku', 'kode', 'kode_barang', 'kode barang', 'part_number');
        const name = getField('name', 'nama', 'nama_barang', 'nama barang', 'nama_produk', 'produk');
        const priceRaw = getField('price', 'harga', 'harga_satuan', 'harga satuan', 'hargasatuan');
        const tierRaw = getField('tiers', 'tier', 'diskon_bertingkat', 'diskon bertingkat', 'diskon');
        const coefRaw = getField('coefficient', 'koefisien', 'koefisien_harga', 'min_margin', 'floor');
        const category = getField('category', 'kategori', 'kelompok');
        const unit = getField('unit', 'satuan', 'uom') || 'pcs';
        const description = getField('description', 'deskripsi', 'keterangan');
        const relatedRaw = getField('related', 'produk_terkait', 'related_sku', 'aksesori');

        if (!sku) {
          errors.push({ row: rowNum, error: 'SKU tidak boleh kosong' });
          continue;
        }

        if (!name) {
          errors.push({ row: rowNum, sku, error: 'Nama produk tidak boleh kosong' });
          continue;
        }

        const price = Number(priceRaw?.replace(/[^0-9.]/g, ''));
        if (!price || isNaN(price) || price <= 0) {
          errors.push({ row: rowNum, sku, error: `Harga tidak valid: ${priceRaw}` });
          continue;
        }

        let tiers: any[] = [];
        if (tierRaw) {
          try {
            tiers = parseTiers(tierRaw).map((t) => ({
              min_qty: t.minQty,
              discount_pct: t.discountPct,
            }));
          } catch (e: any) {
            errors.push({ row: rowNum, sku, error: `Format tier diskon error: ${e.message}` });
            continue;
          }
        }

        let coefficient = 0.85; // default 15% max margin concession
        if (coefRaw) {
          const c = Number(coefRaw.replace(',', '.'));
          if (!isNaN(c) && c > 0 && c <= 1.0) {
            coefficient = c;
          }
        }

        validRows.push({
          sku,
          name,
          price: Math.round(price),
          tierRaw,
          tiers,
          coefficient,
          category,
          unit,
          description,
          relatedRaw,
        });
      }

      // Batch insert/upsert into PostgreSQL
      const batchSize = 100;
      let okCount = 0;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        await withTenantTx(tenantId, async (client) => {
          for (const item of batch) {
            await client.query(
              `INSERT INTO products (
                tenant_id, sku, name, price, tier_raw, tiers, coefficient,
                category, unit, description, related_raw, active
              )
              VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, true)
              ON CONFLICT (tenant_id, sku) DO UPDATE SET
                name = EXCLUDED.name,
                price = EXCLUDED.price,
                tier_raw = EXCLUDED.tier_raw,
                tiers = EXCLUDED.tiers,
                coefficient = EXCLUDED.coefficient,
                category = EXCLUDED.category,
                unit = EXCLUDED.unit,
                description = EXCLUDED.description,
                related_raw = EXCLUDED.related_raw,
                active = true,
                updated_at = NOW();`,
              [
                tenantId,
                item.sku,
                item.name,
                item.price,
                item.tierRaw,
                JSON.stringify(item.tiers),
                item.coefficient,
                item.category,
                item.unit,
                item.description,
                item.relatedRaw,
              ]
            );

            // Handle related products if specified in CSV/Excel
            if (item.relatedRaw) {
              const relatedSkus = item.relatedRaw
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean);

              for (const relSku of relatedSkus) {
                // Ignore self-reference
                if (relSku.toLowerCase() === item.sku.toLowerCase()) continue;
                await client.query(
                  `INSERT INTO product_relations (tenant_id, from_sku, to_sku, type, source, score)
                   VALUES ($1, $2, $3, 'complement', 'import', 0.9)
                   ON CONFLICT (tenant_id, from_sku, to_sku, type) DO NOTHING;`,
                  [tenantId, item.sku, relSku]
                );
              }
            }

            okCount++;
          }
        });
      }

      const errorCount = errors.length;
      log.info({ okCount, errorCount }, 'Catalog import database upsert finished');

      // Update import summary
      await query(
        `UPDATE catalog_imports
         SET status = 'done',
             ok_rows = $2,
             error_rows = $3,
             error_report_key = $4,
             finished_at = NOW()
         WHERE id = $1`,
        [
          importId,
          okCount,
          errorCount,
          errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
        ]
      );

      // Trigger automatic AI enrichment for the imported products
      if (okCount > 0) {
        await enrichQueue.add(
          'catalog.enrich',
          {
            tenantId,
            importId,
          },
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
        );
        log.info('Dispatched catalog.enrich job');
      }
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on('failed', async (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Catalog import job failed');
    if (job?.data?.importId) {
      await query(
        `UPDATE catalog_imports SET status = 'failed', finished_at = NOW() WHERE id = $1`,
        [job.data.importId]
      );
    }
  });

  return worker;
}
