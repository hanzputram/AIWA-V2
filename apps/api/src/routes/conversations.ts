/**
 * AIWA v2 - Conversation Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '@aiwa/db';

export async function conversationRoutes(app: FastifyInstance) {
  // Auth hook for all routes
  app.addHook('preHandler', async (req: FastifyRequest) => {
    await req.jwtVerify();
  });

  // List conversations
  app.get('/', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { stage, mode, q, cursor, limit = '20' } = req.query as any;

    let sql = `
      SELECT c.*, co.name as contact_name, co.company as contact_company,
             co.wa_id, co.lead_score, co.stage as contact_stage,
             (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND direction = 'in' AND status IS NULL) as unread_count
      FROM conversations c
      JOIN contacts co ON co.id = c.contact_id
      WHERE c.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIdx = 2;

    if (stage) {
      sql += ` AND co.stage = $${paramIdx++}`;
      params.push(stage);
    }
    if (mode) {
      sql += ` AND c.mode = $${paramIdx++}`;
      params.push(mode);
    }
    if (q) {
      sql += ` AND (co.name ILIKE $${paramIdx} OR co.company ILIKE $${paramIdx} OR co.wa_id ILIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }
    if (cursor) {
      sql += ` AND c.updated_at < $${paramIdx++}`;
      params.push(cursor);
    }

    sql += ` ORDER BY c.last_message_at DESC NULLS LAST LIMIT $${paramIdx}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    return { conversations: result.rows };
  });

  // Get conversation messages
  app.get('/:id/messages', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { id } = req.params as { id: string };
    const { before, limit = '50' } = req.query as any;

    let sql = `
      SELECT * FROM messages
      WHERE tenant_id = $1 AND conversation_id = $2
    `;
    const params: any[] = [tenantId, id];
    let paramIdx = 3;

    if (before) {
      sql += ` AND created_at < $${paramIdx++}`;
      params.push(before);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIdx}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    return { messages: result.rows.reverse() };
  });

  // Takeover conversation (human takes over from AI)
  app.post('/:id/takeover', async (req: FastifyRequest) => {
    const { tenantId, userId } = req.user as any;
    const { id } = req.params as { id: string };

    await query(
      `UPDATE conversations SET mode = 'human', assigned_user = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, userId]
    );

    // Add system message
    await query(
      `INSERT INTO messages (tenant_id, conversation_id, direction, sender, type, body, created_at)
       VALUES ($1, $2, 'out', 'system', 'text', 'Percakapan diambil alih oleh sales', NOW())`,
      [tenantId, id]
    );

    return { success: true, mode: 'human' };
  });

  // Release conversation back to AI
  app.post('/:id/release', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { id } = req.params as { id: string };

    await query(
      `UPDATE conversations SET mode = 'ai', assigned_user = NULL, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    await query(
      `INSERT INTO messages (tenant_id, conversation_id, direction, sender, type, body, created_at)
       VALUES ($1, $2, 'out', 'system', 'text', 'Percakapan dikembalikan ke AI', NOW())`,
      [tenantId, id]
    );

    return { success: true, mode: 'ai' };
  });

  // Send manual message
  app.post('/:id/messages', async (req: FastifyRequest) => {
    const { tenantId, userId } = req.user as any;
    const { id } = req.params as { id: string };
    const { body: text } = req.body as { body: string };

    // Get conversation & contact
    const conv = await query(
      `SELECT c.*, co.wa_id FROM conversations c
       JOIN contacts co ON co.id = c.contact_id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [id, tenantId]
    );

    if (conv.rows.length === 0) {
      throw app.httpErrors.notFound();
    }

    // Save message
    const result = await query(
      `INSERT INTO messages (tenant_id, conversation_id, direction, sender, type, body, created_at)
       VALUES ($1, $2, 'out', 'human', 'text', $3, NOW())
       RETURNING *`,
      [tenantId, id, text]
    );

    // TODO: Send via WhatsApp adapter

    return { message: result.rows[0] };
  });

  // Give feedback on AI message
  app.post('/:convId/messages/:msgId/feedback', async (req: FastifyRequest) => {
    const { tenantId } = req.user as any;
    const { convId, msgId } = req.params as { convId: string; msgId: string };
    const { feedback, correction } = req.body as { feedback: 'up' | 'down'; correction?: string };

    await query(
      `UPDATE messages SET feedback = $3, correction = $4
       WHERE id = $1 AND tenant_id = $2`,
      [msgId, tenantId, feedback, correction]
    );

    return { success: true };
  });
}
