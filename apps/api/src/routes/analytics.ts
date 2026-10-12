/**
 * AIWA v2 - Analytics Routes
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { query } from '@aiwa/db';

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req: FastifyRequest) => { await req.jwtVerify(); });

  app.get('/summary', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { from, to } = req.query as any;
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString();
    const dateTo = to || new Date().toISOString();

    const [convs, contacts, messages, negotiations, aiCosts] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE mode = 'ai') as ai_mode,
             COUNT(*) FILTER (WHERE mode = 'human') as human_mode
             FROM conversations WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`, [tenantId, dateFrom, dateTo]),
      query(`SELECT stage, COUNT(*) as count FROM contacts
             WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3 GROUP BY stage`, [tenantId, dateFrom, dateTo]),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE direction = 'in') as inbound,
             COUNT(*) FILTER (WHERE direction = 'out') as outbound,
             COUNT(*) FILTER (WHERE sender = 'ai') as ai_sent
             FROM messages WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`, [tenantId, dateFrom, dateTo]),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'accepted') as won,
             AVG(round) as avg_rounds, AVG(current_extra_pct) as avg_discount
             FROM negotiations WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`, [tenantId, dateFrom, dateTo]),
      query(`SELECT SUM(tokens_in + tokens_out) as total_tokens, COUNT(*) as calls
             FROM ai_events WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`, [tenantId, dateFrom, dateTo]),
    ]);

    return {
      period: { from: dateFrom, to: dateTo },
      conversations: convs.rows[0],
      pipeline: contacts.rows,
      messages: messages.rows[0],
      negotiations: negotiations.rows[0],
      aiUsage: aiCosts.rows[0],
    };
  });
}
