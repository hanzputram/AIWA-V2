/**
 * AIWA v2 - Catalog AI Enrichment Worker
 *
 * Enriches catalog products with:
 * 1. Semantic embeddings (text-embedding-004) for vector search
 * 2. Function summary and practical use cases via Gemini
 * 3. Automatic product cross-sell / complement relationships
 */

import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { query } from '@aiwa/db';
import { createLLMClient } from '@aiwa/core';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const llm = createLLMClient();

export interface EnrichJobData {
  tenantId: string;
  importId?: string;
  skus?: string[];
}

export function startEnrichWorker(redis: IORedis): Worker<EnrichJobData> {
  const worker = new Worker<EnrichJobData>(
    'catalog.enrich',
    async (job: Job<EnrichJobData>) => {
      const { tenantId, importId, skus } = job.data;
      const log = logger.child({ tenantId, importId });

      log.info('Starting catalog enrichment...');

      // Find products that need enrichment
      let sql = `
        SELECT sku, name, category, unit, description, price
        FROM products
        WHERE tenant_id = $1 AND active = true
      `;
      const params: any[] = [tenantId];

      if (skus && skus.length > 0) {
        sql += ` AND sku = ANY($2)`;
        params.push(skus);
      } else {
        sql += ` AND (embedding IS NULL OR function_summary IS NULL) LIMIT 100`;
      }

      const productsResult = await query(sql, params);
      const products = productsResult.rows;

      log.info({ count: products.length }, 'Found products to enrich');
      if (products.length === 0) return;

      for (const p of products) {
        try {
          // 1. Generate function summary & use cases via Gemini
          const prompt = `Analisis produk katalog berikut untuk sales AI:
Nama: ${p.name}
Kategori: ${p.category || '-'}
Deskripsi: ${p.description || '-'}

Jawab HANYA dalam JSON valid:
{
  "function_summary": "1 kalimat penjelasan fungsi praktis produk ini",
  "use_cases": ["use case 1", "use case 2", "use case 3"]
}`;

          let functionSummary = '';
          let useCases: string[] = [];

          try {
            const genRes = await llm.generate({
              model: 'fast',
              messages: [{ role: 'user', parts: [{ text: prompt }] }],
              temperature: 0.2,
              maxOutputTokens: 300,
            });

            const parsed = JSON.parse(
              genRes.text.replace(/```json/g, '').replace(/```/g, '').trim()
            );
            functionSummary = parsed.function_summary || '';
            useCases = Array.isArray(parsed.use_cases) ? parsed.use_cases : [];
          } catch (e) {
            log.warn({ sku: p.sku }, 'Failed to generate LLM summary, using fallback');
            functionSummary = p.description || p.name;
          }

          // 2. Generate vector embedding
          const textToEmbed = `${p.name} ${p.category || ''} ${p.description || ''} ${functionSummary}`.trim();
          let embedding: number[] | null = null;

          try {
            const embedRes = await llm.embed(textToEmbed);
            if (embedRes.embedding && embedRes.embedding.length > 0) {
              embedding = embedRes.embedding;
            }
          } catch (e: any) {
            log.warn({ err: e.message, sku: p.sku }, 'Failed to generate embedding');
          }

          // 3. Save to database
          if (embedding) {
            await query(
              `UPDATE products
               SET function_summary = $3,
                   use_cases = $4,
                   embedding = $5::vector,
                   updated_at = NOW()
               WHERE tenant_id = $1 AND sku = $2`,
              [tenantId, p.sku, functionSummary, useCases, JSON.stringify(embedding)]
            );
          } else {
            await query(
              `UPDATE products
               SET function_summary = $3,
                   use_cases = $4,
                   updated_at = NOW()
               WHERE tenant_id = $1 AND sku = $2`,
              [tenantId, p.sku, functionSummary, useCases]
            );
          }

          log.info({ sku: p.sku }, 'Enriched product');
        } catch (err: any) {
          log.error({ err: err.message, sku: p.sku }, 'Error enriching product');
        }
      }

      log.info('Catalog enrichment completed');
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Enrich job failed');
  });

  return worker;
}
