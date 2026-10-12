/**
 * AIWA v2 - Tenant Routes
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { query } from '@aiwa/db';

export async function tenantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req: FastifyRequest) => { await req.jwtVerify(); });

  app.get('/settings', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const result = await query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]);
    if (result.rows.length === 0) throw app.httpErrors.notFound();
    return { tenant: result.rows[0] };
  });

  app.put('/settings', async (req: FastifyRequest) => {
    const { tenantId, role } = req.user as any;
    if (!['owner', 'admin'].includes(role)) throw app.httpErrors.forbidden();
    const { profile, negotiation, settings, wa_config } = req.body as any;
    const sets: string[] = []; const params: any[] = [tenantId]; let idx = 2;
    if (profile) { sets.push(`profile = $${idx++}`); params.push(JSON.stringify(profile)); }
    if (negotiation) { sets.push(`negotiation = $${idx++}`); params.push(JSON.stringify(negotiation)); }
    if (settings) { sets.push(`settings = $${idx++}`); params.push(JSON.stringify(settings)); }
    if (wa_config) { sets.push(`wa_config = $${idx++}`); params.push(JSON.stringify(wa_config)); }
    if (sets.length === 0) throw app.httpErrors.badRequest();
    sets.push('updated_at = NOW()');
    await query(`UPDATE tenants SET ${sets.join(',')} WHERE id = $1`, params);
    return { success: true };
  });

  // List team members
  app.get('/team', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const result = await query(
      `SELECT id, email, name, role, active, last_login_at, created_at
       FROM users WHERE tenant_id = $1 ORDER BY created_at`, [tenantId]
    );
    return { users: result.rows };
  });
}
