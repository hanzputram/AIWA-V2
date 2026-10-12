/**
 * AIWA v2 - Conversation Worker
 *
 * Orchestrates AI conversation processing:
 * load context → classify intent → pick skills → Gemini + tools → validate → send
 */

import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { query, withTenant } from '@aiwa/db';
import {
  createLLMClient,
  buildSystemPrompt,
  AGENT_TOOLS,
  validateReply,
  extractNumbers,
  buildCorrectionPrompt,
  pickSkills,
  loadSkillCards,
  searchProducts,
  suggestRelated,
  unitPrice,
  nextOffer,
  buildQuote,
  formatRupiah,
  formatSearchResults,
  formatQuoteForChat,
  WhatsAppCloudAdapter,
} from '@aiwa/core';
import type {
  TenantProfile,
  ConversationContext,
  SkillCard,
  ValidationContext,
  PricedProduct,
  NegoCfg,
} from '@aiwa/core';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const llm = createLLMClient();

// Load skill cards once
const skillCards = loadSkillCards();

// Opt-out keywords
const OPT_OUT_KEYWORDS = ['stop', 'berhenti', 'jangan hubungi lagi', 'unsubscribe', 'opt out', 'keluar'];

interface ConversationJob {
  tenantId: string;
  conversationId: string;
  contactId: string;
  messageId: string;
}

async function processConversation(job: Job<ConversationJob>) {
  const { tenantId, conversationId, contactId } = job.data;
  const log = logger.child({ tenantId, conversationId });

  try {
    // Load context
    const [convResult, contactResult, messagesResult, tenantResult, negoResult] = await Promise.all([
      query(`SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2`, [conversationId, tenantId]),
      query(`SELECT * FROM contacts WHERE id = $1 AND tenant_id = $2`, [contactId, tenantId]),
      query(`SELECT * FROM messages WHERE conversation_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 20`, [conversationId, tenantId]),
      query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]),
      query(`SELECT * FROM negotiations WHERE conversation_id = $1 AND tenant_id = $2 AND status = 'open'`, [conversationId, tenantId]),
    ]);

    const conversation = convResult.rows[0];
    const contact = contactResult.rows[0];
    const messages = messagesResult.rows.reverse();
    const tenant = tenantResult.rows[0];
    const activeNegotiations = negoResult.rows;

    // Skip if not in AI mode
    if (conversation.mode !== 'ai') {
      log.info('Conversation not in AI mode, skipping');
      return;
    }

    // Check opt-out
    if (contact.opted_out) {
      log.info('Contact opted out, skipping');
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.body && OPT_OUT_KEYWORDS.some(k => lastMessage.body.toLowerCase().includes(k))) {
      await query(`UPDATE contacts SET opted_out = true, opted_out_at = NOW() WHERE id = $1`, [contactId]);
      // Send opt-out confirmation via WhatsApp
      log.info('Contact opted out');
      return;
    }

    // Classify intent
    const messageHistory = messages
      .filter(m => m.body)
      .map(m => `${m.sender}: ${m.body}`)
      .join('\n');

    const intents = [
      'greeting', 'product_inquiry', 'price_request', 'negotiation',
      'objection', 'ready_to_buy', 'company_info', 'complaint',
      'off_topic', 'follow_up', 'qualification',
    ];

    const { intent } = await llm.classifyIntent(
      lastMessage?.body || '',
      conversation.summary || messageHistory.slice(-500),
      intents
    );

    log.info({ intent }, 'Classified intent');

    // Pick skills
    const flags = {
      crossSell: conversation.deal_stage === 'proposal' || conversation.deal_stage === 'negotiation',
      stalled: false,
      highValue: false,
    };

    const selectedSkillNames = pickSkills(intent, flags);
    const selectedSkills: SkillCard[] = selectedSkillNames
      .map(name => skillCards.get(name))
      .filter(Boolean) as SkillCard[];

    // Build prompt
    const tenantProfile: TenantProfile = {
      name: tenant.name,
      industry: tenant.industry,
      ...tenant.profile,
    };

    const convContext: ConversationContext = {
      contactName: contact.name,
      contactCompany: contact.company,
      summary: conversation.summary,
      dealStage: conversation.deal_stage,
      lastIntent: intent,
      productsDiscussed: conversation.products_discussed,
      activeNegotiations: activeNegotiations.map(n => ({
        sku: n.sku, round: n.round, status: n.status,
      })),
    };

    const systemPrompt = buildSystemPrompt(tenantProfile, selectedSkills, convContext);

    // Build message history for Gemini
    const geminiMessages = messages
      .filter(m => m.body && m.sender !== 'system')
      .map(m => ({
        role: m.direction === 'in' ? 'user' as const : 'model' as const,
        parts: [{ text: m.body }],
      }));

    // AI generation loop with tool calling
    const allowedNumbers = new Set<number>();
    const allowedSKUs = new Set<string>();
    let currentMessages = geminiMessages;

    for (let i = 0; i < 5; i++) {
      const result = await llm.generate({
        systemInstruction: systemPrompt,
        messages: currentMessages,
        tools: AGENT_TOOLS,
        temperature: intent === 'negotiation' ? 0.5 : 0.7,
      });

      // Log AI event
      await query(
        `INSERT INTO ai_events (tenant_id, conversation_id, kind, model, tokens_in, tokens_out, duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, conversationId, 'generate', result.model, result.tokensIn, result.tokensOut, result.durationMs]
      );

      // Handle function calls
      if (result.functionCalls.length > 0) {
        const toolResults = await Promise.all(
          result.functionCalls.map(async (fc) => {
            const toolResult = await executeToolCall(fc.name, fc.args, tenantId, conversationId, contactId, tenant);
            // Extract numbers for validation
            const nums = extractNumbers([toolResult]);
            nums.forEach(n => allowedNumbers.add(n));
            return { name: fc.name, result: toolResult };
          })
        );

        // Append tool results to messages
        currentMessages = [
          ...currentMessages,
          {
            role: 'model' as const,
            parts: result.functionCalls.map(fc => ({
              functionCall: { name: fc.name, args: fc.args },
            })) as any,
          },
          {
            role: 'user' as const,
            parts: toolResults.map(tr => ({
              functionResponse: { name: tr.name, response: tr.result },
            })) as any,
          },
        ];
        continue;
      }

      // Validate text response
      const validationCtx: ValidationContext = {
        allowedNumbers,
        allowedSKUs,
        allowedProducts: new Set(),
        tenantCurrency: 'IDR',
      };

      const validation = validateReply(result.text, validationCtx);

      if (!validation.ok && i < 4) {
        log.warn({ errors: validation.errors }, 'Reply validation failed, retrying');
        currentMessages = [
          ...currentMessages,
          { role: 'model' as const, parts: [{ text: result.text }] },
          { role: 'user' as const, parts: [{ text: buildCorrectionPrompt(validation.errors) }] },
        ];
        continue;
      }

      // Send reply
      const replyText = result.text || 'Terima kasih, ada yang bisa saya bantu?';

      // Save outgoing message
      await query(
        `INSERT INTO messages (tenant_id, conversation_id, direction, sender, type, body, created_at)
         VALUES ($1, $2, 'out', 'ai', 'text', $3, NOW())`,
        [tenantId, conversationId, replyText]
      );

      // Send via WhatsApp
      try {
        if (tenant.wa_config?.phone_number_id && tenant.wa_config?.access_token) {
          const adapter = new WhatsAppCloudAdapter({
            phoneNumberId: tenant.wa_config.phone_number_id,
            accessToken: tenant.wa_config.access_token,
            appSecret: process.env.WA_APP_SECRET || '',
            verifyToken: '',
            graphVersion: process.env.WA_GRAPH_VERSION || 'v21.0',
          });
          await adapter.sendText(contact.wa_id, replyText);
        }
      } catch (sendErr) {
        log.error(sendErr, 'Failed to send WhatsApp message');
      }

      // Update conversation
      await query(
        `UPDATE conversations SET last_intent = $3, last_message_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [conversationId, tenantId, intent]
      );

      log.info('Reply sent successfully');
      break;
    }
  } catch (err) {
    log.error(err, 'Conversation processing error');
    throw err;
  }
}

/**
 * Execute a tool call from the AI
 */
async function executeToolCall(
  name: string,
  args: Record<string, any>,
  tenantId: string,
  conversationId: string,
  contactId: string,
  tenant: any
): Promise<any> {
  const client = (await import('@aiwa/db')).getPool();
  const poolClient = await client.connect();

  try {
    switch (name) {
      case 'search_products': {
        const results = await searchProducts(poolClient, {
          tenantId,
          query: args.query,
          category: args.category,
          limit: args.limit || 5,
        });
        return {
          products: results.map(r => ({
            sku: r.product.sku,
            name: r.product.name,
            price: r.product.price,
            priceFormatted: formatRupiah(r.product.price),
            category: r.product.category,
            unit: r.product.unit,
            description: r.product.description,
            tierInfo: r.product.tier_raw || 'Tidak ada diskon bertingkat',
          })),
          count: results.length,
        };
      }

      case 'get_quote': {
        const productResult = await poolClient.query(
          `SELECT * FROM products WHERE tenant_id = $1 AND sku = $2 AND active = true`,
          [tenantId, args.sku]
        );
        if (productResult.rows.length === 0) {
          return { error: `Produk ${args.sku} tidak ditemukan` };
        }
        const product = productResult.rows[0];
        const p: PricedProduct = {
          sku: product.sku,
          name: product.name,
          price: Number(product.price),
          tiers: product.tiers || [],
          coefficient: Number(product.coefficient),
          unit: product.unit,
        };
        const price = unitPrice(p, args.qty);
        return {
          sku: p.sku,
          name: p.name,
          qty: args.qty,
          unit: p.unit,
          originalPrice: p.price,
          originalPriceFormatted: formatRupiah(p.price),
          unitPrice: price.unit,
          unitPriceFormatted: formatRupiah(price.unit),
          tierDiscount: price.tierPct,
          totalDiscount: price.totalDiscountPct,
          subtotal: price.unit * args.qty,
          subtotalFormatted: formatRupiah(price.unit * args.qty),
          savingPerUnit: price.saving,
        };
      }

      case 'negotiate_price': {
        const productResult = await poolClient.query(
          `SELECT * FROM products WHERE tenant_id = $1 AND sku = $2 AND active = true`,
          [tenantId, args.sku]
        );
        if (productResult.rows.length === 0) {
          return { error: `Produk ${args.sku} tidak ditemukan` };
        }
        const product = productResult.rows[0];
        const p: PricedProduct = {
          sku: product.sku,
          name: product.name,
          price: Number(product.price),
          tiers: product.tiers || [],
          coefficient: Number(product.coefficient),
          unit: product.unit,
        };

        // Get or create negotiation state
        let negoResult = await poolClient.query(
          `SELECT * FROM negotiations WHERE tenant_id = $1 AND conversation_id = $2 AND sku = $3 AND status = 'open'`,
          [tenantId, conversationId, args.sku]
        );

        let state = { round: 0, extraPct: 0 };
        if (negoResult.rows.length > 0) {
          state = { round: negoResult.rows[0].round, extraPct: Number(negoResult.rows[0].current_extra_pct) };
        }

        const cfg: NegoCfg = tenant.negotiation || {
          budget_share: 0.6, ladder: [0.5, 0.8, 1.0], max_rounds: 3,
          price_lock_hours: 24, require_give_for_get: true, handoff_value_threshold: 50000000,
        };

        const offer = nextOffer(p, args.qty, state, cfg, args.customer_gives || 'none');

        if (offer.allowed && offer.state) {
          // Save negotiation state
          if (negoResult.rows.length === 0) {
            await poolClient.query(
              `INSERT INTO negotiations (tenant_id, conversation_id, sku, qty, round, current_extra_pct, last_offer_unit_price, history)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [tenantId, conversationId, args.sku, args.qty, offer.state.round, offer.state.extraPct,
               offer.offer!.unit, JSON.stringify([{ ...offer.state, unitPrice: offer.offer!.unit, timestamp: new Date().toISOString() }])]
            );
          } else {
            const history = [...(negoResult.rows[0].history || []), { ...offer.state, unitPrice: offer.offer!.unit, timestamp: new Date().toISOString() }];
            await poolClient.query(
              `UPDATE negotiations SET round = $3, current_extra_pct = $4, last_offer_unit_price = $5, history = $6, updated_at = NOW()
               WHERE tenant_id = $1 AND id = $2`,
              [tenantId, negoResult.rows[0].id, offer.state.round, offer.state.extraPct, offer.offer!.unit, JSON.stringify(history)]
            );
          }
        }

        return {
          allowed: offer.allowed,
          reason: offer.reason,
          message: offer.message,
          isFinal: offer.isFinal,
          sku: p.sku,
          name: p.name,
          qty: args.qty,
          unitPrice: offer.offer?.unit,
          unitPriceFormatted: offer.offer ? formatRupiah(offer.offer.unit) : undefined,
          totalDiscount: offer.offer?.totalDiscountPct,
          subtotal: offer.offer ? offer.offer.unit * args.qty : undefined,
          subtotalFormatted: offer.offer ? formatRupiah(offer.offer.unit * args.qty) : undefined,
          round: offer.state?.round ?? state.round,
        };
      }

      case 'suggest_related_products': {
        const results = await suggestRelated(poolClient, {
          tenantId,
          sku: args.sku,
          limit: args.limit || 3,
        });
        return {
          suggestions: results.map(r => ({
            sku: r.product.sku,
            name: r.product.name,
            price: r.product.price,
            priceFormatted: formatRupiah(Number(r.product.price)),
            relationType: r.relationType,
            reason: r.reason,
          })),
        };
      }

      case 'send_company_profile': {
        const kind = args.kind || 'company_profile';
        const docResult = await poolClient.query(
          `SELECT * FROM documents WHERE tenant_id = $1 AND kind = $2 ORDER BY created_at DESC LIMIT 1`,
          [tenantId, kind]
        );
        if (docResult.rows.length === 0) {
          return { sent: false, message: 'Dokumen belum tersedia' };
        }
        // TODO: Send document via WhatsApp
        return { sent: true, document: docResult.rows[0].title };
      }

      case 'update_crm_fields': {
        const fields = args.fields;
        if (fields.name) {
          await poolClient.query(`UPDATE contacts SET name = $1 WHERE id = $2`, [fields.name, contactId]);
        }
        if (fields.company) {
          await poolClient.query(`UPDATE contacts SET company = $1 WHERE id = $2`, [fields.company, contactId]);
        }
        // Store additional fields in JSON
        await poolClient.query(
          `UPDATE contacts SET fields = fields || $1::jsonb, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(fields), contactId]
        );
        return { saved: true };
      }

      case 'handoff_to_human': {
        await poolClient.query(
          `UPDATE conversations SET mode = 'human', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
          [conversationId, tenantId]
        );
        await poolClient.query(
          `INSERT INTO messages (tenant_id, conversation_id, direction, sender, type, body, meta, created_at)
           VALUES ($1, $2, 'out', 'system', 'text', 'Percakapan dieskalasi ke tim sales', $3, NOW())`,
          [tenantId, conversationId, JSON.stringify({ reason: args.reason })]
        );
        return { handedOff: true, reason: args.reason };
      }

      case 'create_quote': {
        const items = args.items || [];
        const quoteItems = [];
        for (const item of items) {
          const pResult = await poolClient.query(
            `SELECT * FROM products WHERE tenant_id = $1 AND sku = $2 AND active = true`,
            [tenantId, item.sku]
          );
          if (pResult.rows.length > 0) {
            const product = pResult.rows[0];
            quoteItems.push({
              product: {
                sku: product.sku,
                name: product.name,
                price: Number(product.price),
                tiers: product.tiers || [],
                coefficient: Number(product.coefficient),
                unit: product.unit,
              } as PricedProduct,
              qty: item.qty,
            });
          }
        }
        if (quoteItems.length === 0) {
          return { error: 'Tidak ada produk yang ditemukan untuk penawaran' };
        }
        const quote = buildQuote(quoteItems);
        return {
          lines: quote.lines,
          total: quote.total,
          totalFormatted: formatRupiah(quote.total),
          formatted: formatQuoteForChat(quote),
        };
      }

      default:
        return { error: `Tool ${name} tidak dikenali` };
    }
  } finally {
    poolClient.release();
  }
}

// Start worker
export function startConversationWorker(redis: IORedis) {
  const worker = new Worker('conversation', processConversation, {
    connection: redis,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Conversation job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Conversation job failed');
  });

  return worker;
}
