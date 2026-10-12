/**
 * AIWA v2 - Contact Routes
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { query } from '@aiwa/db';

export async function contactRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req: FastifyRequest) => { await req.jwtVerify(); });

  app.get('/', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { stage, q, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let sql = `SELECT * FROM contacts WHERE tenant_id = $1`;
    const params: any[] = [tenantId]; let idx = 2;
    if (stage) { sql += ` AND stage = $${idx++}`; params.push(stage); }
    if (q) { sql += ` AND (name ILIKE $${idx} OR company ILIKE $${idx} OR wa_id ILIKE $${idx})`; params.push(`%${q}%`); idx++; }
    const [data, count] = await Promise.all([
      query(sql + ` ORDER BY lead_score DESC, updated_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, parseInt(limit), offset]),
      query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params),
    ]);
    return { contacts: data.rows, total: parseInt(count.rows[0].count) };
  });

  app.get('/:id', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { id } = req.params as { id: string };
    const result = await query(`SELECT * FROM contacts WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    if (result.rows.length === 0) throw app.httpErrors.notFound();
    return { contact: result.rows[0] };
  });

  app.patch('/:id', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { id } = req.params as { id: string };
    const { name, company, stage, tags, fields } = req.body as any;
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
    if (company !== undefined) { sets.push(`company = $${idx++}`); params.push(company); }
    if (stage !== undefined) { sets.push(`stage = $${idx++}`); params.push(stage); }
    if (tags !== undefined) { sets.push(`tags = $${idx++}`); params.push(tags); }
    if (fields !== undefined) { sets.push(`fields = fields || $${idx++}::jsonb`); params.push(JSON.stringify(fields)); }
    if (sets.length === 0) throw app.httpErrors.badRequest();
    sets.push('updated_at = NOW()');
    await query(`UPDATE contacts SET ${sets.join(',')} WHERE id = $1 AND tenant_id = $2`, params);
    return { success: true };
  });
}
