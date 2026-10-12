/**
 * AIWA v2 - Document Routes
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { query } from '@aiwa/db';

export async function documentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req: FastifyRequest) => { await req.jwtVerify(); });

  app.get('/', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const result = await query(
      `SELECT * FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]
    );
    return { documents: result.rows };
  });

  app.post('/', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { kind, title, filename } = req.body as any;
    // TODO: File upload
    const result = await query(
      `INSERT INTO documents (tenant_id, kind, title, filename, storage_key)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, kind, title, filename, `documents/${tenantId}/${filename}`]
    );
    return { document: result.rows[0] };
  });

  app.delete('/:id', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { id } = req.params as { id: string };
    await query(`DELETE FROM documents WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    return { success: true };
  });
}
