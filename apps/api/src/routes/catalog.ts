/**
 * AIWA v2 - Catalog Routes
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import { query } from '@aiwa/db';

export async function catalogRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req: FastifyRequest) => { await req.jwtVerify(); });

  // Search products
  app.get('/products', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { q, category, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `SELECT * FROM products WHERE tenant_id = $1 AND active = true`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (q) {
      sql += ` AND (name ILIKE $${idx} OR sku ILIKE $${idx} OR category ILIKE $${idx})`;
      params.push(`%${q}%`);
      idx++;
    }
    if (category) {
      sql += ` AND category = $${idx++}`;
      params.push(category);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const [dataResult, countResult] = await Promise.all([
      query(sql + ` ORDER BY name LIMIT $${idx} OFFSET $${idx + 1}`, [...params, parseInt(limit), offset]),
      query(countSql, params),
    ]);

    return {
      products: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    };
  });

  // Get categories
  app.get('/categories', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const result = await query(
      `SELECT category, COUNT(*) as count FROM products
       WHERE tenant_id = $1 AND active = true AND category IS NOT NULL
       GROUP BY category ORDER BY category`,
      [tenantId]
    );
    return { categories: result.rows };
  });

  // Get import status
  app.get('/imports', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const result = await query(
      `SELECT * FROM catalog_imports WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [tenantId]
    );
    return { imports: result.rows };
  });

  // Get import details
  app.get('/imports/:id', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { id } = req.params as { id: string };
    const result = await query(
      `SELECT * FROM catalog_imports WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (result.rows.length === 0) throw app.httpErrors.notFound();
    return { import: result.rows[0] };
  });

  // Upload catalog (supports multipart file or JSON with base64)
  app.post('/imports', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    let filename = 'catalog.csv';
    let fileBuffer: Buffer | null = null;

    if (req.isMultipart()) {
      const part = await req.file();
      if (!part) throw app.httpErrors.badRequest('No file uploaded');
      filename = part.filename;
      fileBuffer = await part.toBuffer();
    } else {
      const body = req.body as any;
      if (body?.fileBase64) {
        fileBuffer = Buffer.from(body.fileBase64, 'base64');
        if (body.filename) filename = body.filename;
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw app.httpErrors.badRequest('File is empty or missing');
    }

    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    const storageKey = `imports/${tenantId}/${Date.now()}_${filename}`;

    // Create import record
    const result = await query(
      `INSERT INTO catalog_imports (tenant_id, filename, file_sha256, storage_key, status)
       VALUES ($1, $2, $3, $4, 'queued')
       ON CONFLICT (tenant_id, file_sha256) DO UPDATE SET status = 'queued', updated_at = NOW()
       RETURNING id;`,
      [tenantId, filename, fileHash, storageKey]
    );

    const importId = result.rows[0].id;

    // Dispatch to BullMQ worker
    const queues = (app as any).queues;
    if (queues?.import) {
      await queues.import.add('catalog.import', {
        importId,
        tenantId,
        fileBufferBase64: fileBuffer.toString('base64'),
        filename,
      });
    }

    return {
      message: 'Catalog import queued successfully',
      importId,
      filename,
      status: 'queued',
    };
  });

  // Download template
  app.get('/template', async (req: FastifyRequest, reply) => {
    const csvContent = [
      'sku,nama,harga,diskon_bertingkat,koefisien,kategori,satuan,deskripsi,produk_terkait',
      'KBL-NYM-3X25-100,Kabel NYM 3x2.5mm Supreme (Roll 100m),1350000,"10:3%, 25:5%, 50:8%",0.88,Kabel,roll,"Kabel tembaga tunggal isi 3 standar SNI.",PPA-CND-PVC-20',
      'PPA-CND-PVC-20,Pipa Konduit PVC 20mm 2.9m Clipsal,18500,"50:4%, 100:8%, 300:12%",0.85,Konduit & Aksesori,batang,"Pipa pelindung kabel elastis anti pecah.",KLM-CND-20',
      'KLM-CND-20,Klem Pipa Konduit 20mm Putih (Pack 50 pcs),32000,"10:5%, 30:10%",0.82,Konduit & Aksesori,pack,"Klem sadel pengikat pipa konduit.",',
      'SKL-TGL-BROCO,Saklar Tunggal Broco Galleo Putih G161,24500,"20:5%, 50:9%, 100:14%",0.84,Saklar & Stop Kontak,pcs,"Saklar tanam flush mount standar SNI.",INB-DOS-BROCO;STP-ARD-BROCO',
      'STP-ARD-BROCO,Stop Kontak Arde Broco Galleo Putih G153,27500,"20:5%, 50:9%, 100:14%",0.84,Saklar & Stop Kontak,pcs,"Stop kontak grounding arde tembaga.",INB-DOS-BROCO',
      'INB-DOS-BROCO,Inbow Doos Tanam Broco B101 Kotak Hitam,4500,"50:6%, 100:12%, 300:18%",0.80,Saklar & Stop Kontak,pcs,"Mangkok tanam dinding saklar/stop kontak.",',
      'MCB-1P-16A-SCH,MCB Domae 1 Pole 16A Schneider Electric,68000,"12:4%, 36:8%, 72:12%",0.86,Proteksi & Panel,pcs,"MCB proteksi beban lebih dan hubung singkat.",BOX-MCB-4G-PRS',
      'BOX-MCB-4G-PRS,Box MCB Inbow 4 Grup Presto Transparan,42000,"10:5%, 25:10%",0.82,Proteksi & Panel,pcs,"Box panel MCB tanam tutup transparan.",',
      'LGT-LED-9W-PHL,Lampu LED Downlight Philips Meson 9W 6500K,52000,"12:5%, 36:10%, 72:15%",0.85,Penerangan & Lampu,pcs,"Downlight plafon hemat energi cahaya putih.",',
    ].join('\r\n');

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="template_katalog_aiwa.csv"');
    return reply.send(csvContent);
  });

  // Manage product relations
  app.post('/relations', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { fromSku, toSku, type } = req.body as any;

    await query(
      `INSERT INTO product_relations (tenant_id, from_sku, to_sku, type, source, score)
       VALUES ($1, $2, $3, $4, 'manual', 1.0)
       ON CONFLICT (tenant_id, from_sku, to_sku, type) DO UPDATE SET score = 1.0`,
      [tenantId, fromSku, toSku, type]
    );

    return { success: true };
  });

  app.delete('/relations', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { fromSku, toSku, type } = req.body as any;

    await query(
      `DELETE FROM product_relations WHERE tenant_id = $1 AND from_sku = $2 AND to_sku = $3 AND type = $4`,
      [tenantId, fromSku, toSku, type]
    );

    return { success: true };
  });
}
