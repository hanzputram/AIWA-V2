/**
 * AIWA v2 - WhatsApp Webhook Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WhatsAppCloudAdapter } from '@aiwa/core';
import { query } from '@aiwa/db';

export async function webhookRoutes(app: FastifyInstance) {
  // GET - Webhook verification
  app.get('/whatsapp', async (req: FastifyRequest, reply: FastifyReply) => {
    const q = req.query as Record<string, string>;
    const verifyToken = process.env.WA_VERIFY_TOKEN;

    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === verifyToken) {
      app.log.info('Webhook verified');
      return reply.send(q['hub.challenge']);
    }

    return reply.code(403).send('Forbidden');
  });

  // POST - Incoming messages
  app.post('/whatsapp', {
    config: { rawBody: true } as any,
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    // Always respond 200 quickly
    reply.send('ok');

    try {
      const body = req.body as any;
      if (!body?.entry) return;

      // Find tenant by phone number
      for (const entry of body.entry) {
        for (const change of entry.changes ?? []) {
          const phoneNumberId = change.value?.metadata?.phone_number_id;
          if (!phoneNumberId) continue;

          // Look up tenant by phone number ID
          const tenantResult = await query(
            `SELECT id FROM tenants WHERE wa_config->>'phone_number_id' = $1 AND active = true`,
            [phoneNumberId]
          );

          if (tenantResult.rows.length === 0) {
            app.log.warn(`No tenant found for phone_number_id: ${phoneNumberId}`);
            continue;
          }

          const tenantId = tenantResult.rows[0].id;

          // Parse messages
          const adapter = new WhatsAppCloudAdapter({
            phoneNumberId,
            accessToken: '', // not needed for parsing
            appSecret: process.env.WA_APP_SECRET || '',
            verifyToken: process.env.WA_VERIFY_TOKEN || '',
            graphVersion: process.env.WA_GRAPH_VERSION || 'v21.0',
          });

          const { messages, statuses } = adapter.parseInbound(body);

          // Process messages
          for (const msg of messages) {
            // Deduplicate
            const existing = await query(
              `SELECT id FROM messages WHERE wa_message_id = $1`,
              [msg.messageId]
            );
            if (existing.rows.length > 0) continue;

            // Find or create contact
            const contactResult = await query(
              `INSERT INTO contacts (tenant_id, wa_id, name, last_seen_at)
               VALUES ($1, $2, $3, NOW())
               ON CONFLICT (tenant_id, wa_id)
               DO UPDATE SET name = COALESCE(EXCLUDED.name, contacts.name), last_seen_at = NOW()
               RETURNING id`,
              [tenantId, msg.waId, msg.profileName]
            );
            const contactId = contactResult.rows[0].id;

            // Find or create conversation
            const convResult = await query(
              `INSERT INTO conversations (tenant_id, contact_id, last_inbound_at, last_message_at)
               VALUES ($1, $2, NOW(), NOW())
               ON CONFLICT (tenant_id, contact_id)
               DO UPDATE SET last_inbound_at = NOW(), last_message_at = NOW()
               RETURNING id, mode`,
              [tenantId, contactId]
            );

            // Fix: use proper upsert logic for conversations
            let convId: string;
            let convMode: string;
            if (convResult.rows.length > 0) {
              convId = convResult.rows[0].id;
              convMode = convResult.rows[0].mode;
            } else {
              const existingConv = await query(
                `SELECT id, mode FROM conversations WHERE tenant_id = $1 AND contact_id = $2 ORDER BY created_at DESC LIMIT 1`,
                [tenantId, contactId]
              );
              convId = existingConv.rows[0].id;
              convMode = existingConv.rows[0].mode;
            }

            // Save message
            await query(
              `INSERT INTO messages (tenant_id, conversation_id, direction, sender, wa_message_id, type, body, media, created_at)
               VALUES ($1, $2, 'in', 'customer', $3, $4, $5, $6, NOW())`,
              [tenantId, convId, msg.messageId, msg.type, msg.text || msg.caption, msg.mediaId ? JSON.stringify({ id: msg.mediaId, type: msg.mimeType }) : null]
            );

            // Enqueue for AI processing (with debounce)
            const queues = (app as any).queues;
            await queues.conversation.add(
              'process',
              { tenantId, conversationId: convId, contactId, messageId: msg.messageId },
              {
                delay: 2500, // 2.5 second debounce
                jobId: `conv-${convId}`, // deduplicate rapid messages
                removeOnComplete: 100,
                removeOnFail: 50,
              }
            );
          }

          // Process status updates
          for (const status of statuses) {
            await query(
              `UPDATE messages SET status = $1 WHERE wa_message_id = $2`,
              [status.status, status.messageId]
            );
          }
        }
      }
    } catch (err) {
      app.log.error(err, 'Webhook processing error');
    }
  });
}
