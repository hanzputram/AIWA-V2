/**
 * Webhook endpoint untuk menerima event dari Playwright WhatsApp Service
 * & Auto-Reply AI Sales Assistant (Claude / Gemini)
 * 
 * POST: terima event (inbound_message, qr_code, session_connected) & trigger AI auto-reply
 * GET:  polling inbox & events oleh dashboard UI
 * PATCH: mark messages as read
 */
import { NextRequest, NextResponse } from "next/server";
import { generateAiReply } from "@/lib/ai-sales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Augment global type for shared in-memory store (survives hot-reload in dev)
declare global {
  var __playwrightInbox: Array<{
    id: string;
    fromPhone: string;
    pushName: string;
    text: string;
    quotedText?: string;
    sessionId: string;
    timestamp: number;
    read: boolean;
    sender?: 'customer' | 'ai';
  }>;
  var __playwrightLastQr: string | null;
  var __playwrightStatus: string;
  var __repliedMsgIds: Set<string>;
  var __replyDebounceTimers: Map<string, { timer: NodeJS.Timeout; texts: string[]; msgIds: string[]; sessionId: string }>;
}

if (!global.__playwrightInbox) global.__playwrightInbox = [];
if (!global.__playwrightLastQr) global.__playwrightLastQr = null;
if (!global.__playwrightStatus) global.__playwrightStatus = "disconnected";
if (!global.__repliedMsgIds) global.__repliedMsgIds = new Set();
if (!global.__replyDebounceTimers) global.__replyDebounceTimers = new Map();

const MAX_INBOX = 500;
const PLAYWRIGHT_URL = process.env.PLAYWRIGHT_BACKEND_URL || "http://127.0.0.1:3001";

/**
 * Handle AI auto-reply to incoming WhatsApp message
 */
async function triggerAutoReply({
  msgId,
  fromPhone,
  text,
  sessionId,
}: {
  msgId: string;
  fromPhone: string;
  text: string;
  sessionId: string;
}) {
  if (!fromPhone || !text) return;

  try {
    console.log(`[AI AUTO-REPLY] Generating response for ${fromPhone}: "${text}"...`);

    // Build context history from recent inbox messages for this contact
    const targetDigits = fromPhone.replace(/\D/g, '').slice(-9);
    const recentHistory = global.__playwrightInbox
      .filter((m) => {
        const mDigits = (m.fromPhone || '').replace(/\D/g, '').slice(-9);
        return mDigits === targetDigits && m.id !== msgId;
      })
      .slice(0, 14)
      .reverse()
      .map((m) => ({
        sender: (m.sender === 'ai' ? 'assistant' : 'customer') as 'assistant' | 'customer',
        text: m.text,
      }));

    // Generate response using Claude/Gemini with ATS ARAYA rules
    const aiResult = await generateAiReply(text, recentHistory);
    const replyText = aiResult.replyText;

    if (!replyText) {
      console.warn(`[AI AUTO-REPLY] No reply text generated for ${fromPhone}`);
      return;
    }

    console.log(`[AI AUTO-REPLY] Dispatching reply to ${fromPhone} via Playwright (${aiResult.aiProvider} - ${aiResult.modelUsed}): "${replyText.substring(0, 60)}..."`);

    // Dispatch reply to WhatsApp via Playwright service
    const sendRes = await fetch(`${PLAYWRIGHT_URL}/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId || "default",
        to: fromPhone,
        text: replyText,
      }),
    });

    if (sendRes.ok) {
      const sendData = await sendRes.json();
      console.log(`[AI AUTO-REPLY SUCCESS] Message sent to ${fromPhone}:`, sendData);

      // Record AI response into local inbox history so UI reflects it immediately
      global.__playwrightInbox.unshift({
        id: `ai_reply_${Date.now()}`,
        fromPhone,
        pushName: "ATS ARAYA (AI)",
        text: replyText,
        sessionId: sessionId || "default",
        timestamp: Math.floor(Date.now() / 1000),
        read: true,
        sender: 'ai',
      });
    } else {
      const errText = await sendRes.text();
      console.error(`[AI AUTO-REPLY ERROR] Playwright /messages/send returned ${sendRes.status}:`, errText);
    }
  } catch (err: any) {
    console.error(`[AI AUTO-REPLY EXCEPTION] Failed for ${fromPhone}:`, err.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, sessionId, ...data } = body;

    if (!event) {
      return NextResponse.json({ error: "event field is required" }, { status: 400 });
    }

    console.log(`[WEBHOOK] Playwright event received: ${event} from session [${sessionId}]`);

    if (event === "session_connected") {
      global.__playwrightStatus = "connected";
      global.__playwrightLastQr = null;
    }

    if (event === "session_disconnected") {
      global.__playwrightStatus = "disconnected";
    }

    if (event === "qr_code" && data.qrDataUrl) {
      global.__playwrightLastQr = data.qrDataUrl as string;
      global.__playwrightStatus = "qr_ready";
    }

    // Manual AI trigger from Dashboard button or testing
    if (event === "trigger_ai_reply" && data.phone && data.text) {
      const manualMsgId = `manual_${Date.now()}`;
      triggerAutoReply({
        msgId: manualMsgId,
        fromPhone: data.phone as string,
        text: data.text as string,
        sessionId: sessionId || "default",
      });
      return NextResponse.json({ ok: true, triggered: true });
    }

    if (event === "inbound_message" && data.text) {
      const msgId = (data.messageId as string) || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const alreadyExists = global.__playwrightInbox.some((m) => m.id === msgId);
      const cleanPhone = (data.fromPhone as string) || "";

      if (!alreadyExists) {
        const record = {
          id: msgId,
          fromPhone: cleanPhone,
          pushName: (data.pushName as string) || cleanPhone || "Unknown",
          text: data.text as string,
          quotedText: data.quotedText as string | undefined,
          sessionId: sessionId || "default",
          timestamp: Math.floor(Date.now() / 1000),
          read: false,
          sender: 'customer' as const,
        };
        global.__playwrightInbox.unshift(record);
        if (global.__playwrightInbox.length > MAX_INBOX) {
          global.__playwrightInbox = global.__playwrightInbox.slice(0, MAX_INBOX);
        }
        console.log(`[WEBHOOK] Inbox +1 from ${record.pushName} (${record.fromPhone}): "${record.text.substring(0, 80)}"`);
      }

      // Check if this message was already auto-replied to avoid double-replying
      if (!global.__repliedMsgIds.has(msgId)) {
        global.__repliedMsgIds.add(msgId);
        // Cap set size
        if (global.__repliedMsgIds.size > 2000) {
          const first = global.__repliedMsgIds.values().next().value;
          if (first) global.__repliedMsgIds.delete(first);
        }

        // Debounce: If customer sends multiple short messages in a row (e.g. 2s apart),
        // merge them so AI answers once with full context and does not type in parallel!
        const existingDebounce = global.__replyDebounceTimers.get(cleanPhone);
        if (existingDebounce) {
          clearTimeout(existingDebounce.timer);
          existingDebounce.texts.push(data.text as string);
          existingDebounce.msgIds.push(msgId);
        } else {
          global.__replyDebounceTimers.set(cleanPhone, {
            texts: [data.text as string],
            msgIds: [msgId],
            sessionId: sessionId || "default",
            timer: setTimeout(() => {}, 0),
          });
        }

        const currentEntry = global.__replyDebounceTimers.get(cleanPhone)!;
        currentEntry.timer = setTimeout(() => {
          global.__replyDebounceTimers.delete(cleanPhone);
          const combinedText = currentEntry.texts.join('\n');
          const lastMsgId = currentEntry.msgIds[currentEntry.msgIds.length - 1];

          console.log(`[DEBOUNCE DISPATCH] Sending combined query (${currentEntry.texts.length} messages) for ${cleanPhone}: "${combinedText.substring(0, 80)}"`);
          triggerAutoReply({
            msgId: lastMsgId,
            fromPhone: cleanPhone,
            text: combinedText,
            sessionId: currentEntry.sessionId,
          });
        }, 2200);
      }
    }

    return NextResponse.json({ ok: true, event, received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[WEBHOOK] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { loadSavedContacts } from "@/app/api/contacts/route";

function buildConversations(inbox: any[], pwChats: any[] = []) {
  const phoneMap: Record<string, any> = {};
  const savedContacts = loadSavedContacts();

  // 1. Seed from pwChats if available
  for (const pc of pwChats) {
    const rawDigits = (pc.wa || pc.name || '').replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('0') ? '62' + rawDigits.substring(1) : rawDigits;
    if (cleanPhone) {
      phoneMap[cleanPhone] = {
        id: cleanPhone,
        name: pc.name || `+${cleanPhone}`,
        company: "Kontak WhatsApp",
        wa: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
        lastMsg: pc.lastMsg || 'Tidak ada pesan preview',
        time: pc.time || 'Baru saja',
        timestamp: Math.floor(Date.now() / 1000),
        unread: pc.unread || 0,
        mode: pc.mode || 'ai',
        stage: pc.stage || 'negotiation',
        messages: [],
      };
    }
  }

  // 2. Merge from global.__playwrightInbox
  for (const m of inbox) {
    const rawDigits = (m.fromPhone || m.pushName || '').replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 9
      ? (rawDigits.startsWith('0') ? '62' + rawDigits.substring(1) : rawDigits)
      : (m.fromPhone || 'unknown');

    if (!phoneMap[cleanPhone]) {
      phoneMap[cleanPhone] = {
        id: cleanPhone,
        name: m.pushName || (cleanPhone.startsWith('62') ? `+${cleanPhone}` : cleanPhone),
        company: "Kontak WhatsApp",
        wa: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
        lastMsg: m.text,
        time: new Date(m.timestamp * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        timestamp: m.timestamp,
        unread: 0,
        mode: 'ai',
        stage: 'negotiation',
        messages: [],
      };
    }

    if (m.sender !== 'ai' && !m.read) {
      phoneMap[cleanPhone].unread += 1;
    }

    phoneMap[cleanPhone].messages.push({
      id: m.id,
      sender: m.sender === 'ai' ? 'ai' : 'customer',
      body: m.text,
      time: new Date(m.timestamp * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      timestamp: m.timestamp,
    });

    if (m.timestamp >= (phoneMap[cleanPhone].timestamp || 0)) {
      phoneMap[cleanPhone].lastMsg = m.text;
      phoneMap[cleanPhone].time = new Date(m.timestamp * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      phoneMap[cleanPhone].timestamp = m.timestamp;
    }
  }

  // 3. Apply saved contacts names and metadata
  for (const cleanPhone of Object.keys(phoneMap)) {
    const lastDigits = cleanPhone.slice(-9);
    const saved = Object.values(savedContacts).find((c) => {
      const cDigits = (c.phone || '').replace(/\D/g, '').slice(-9);
      return cDigits === lastDigits;
    });
    if (saved) {
      phoneMap[cleanPhone].name = saved.name;
      phoneMap[cleanPhone].company = saved.company || saved.name;
      phoneMap[cleanPhone].project = saved.project || '-';
      phoneMap[cleanPhone].budget = saved.budget || '-';
      phoneMap[cleanPhone].stage = saved.stage || phoneMap[cleanPhone].stage;
      phoneMap[cleanPhone].address = saved.address || '';
      phoneMap[cleanPhone].notes = saved.notes || '';
      phoneMap[cleanPhone].isSaved = true;
    }
  }

  const convList = Object.values(phoneMap).map((conv) => {
    conv.messages.sort((a: any, b: any) => a.timestamp - b.timestamp);

    if (!conv.isSaved || !conv.stage) {
      const allText = conv.messages.map((m: any) => m.body).join(' ').toLowerCase();
      if (allText.includes('faktur') || allText.includes('invoice') || allText.includes('alamat') || allText.includes('transfer')) {
        conv.stage = 'proposal';
      } else if (allText.includes('beli') || allText.includes('pcs') || allText.includes('harga') || allText.includes('total')) {
        conv.stage = 'negotiation';
      } else {
        conv.stage = 'qualified';
      }
    }

    return conv;
  });

  convList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return convList;
}

export async function GET(request: NextRequest) {
  let pwChats: any[] = [];
  try {
    const pwRes = await fetch(`${PLAYWRIGHT_URL}/sessions/default/chats`, {
      signal: AbortSignal.timeout(1500),
    });
    if (pwRes.ok) {
      const pwData = await pwRes.json();
      if (pwData.success && Array.isArray(pwData.chats)) {
        pwChats = pwData.chats;
      }
    }
  } catch (e) {}

  const conversations = buildConversations(global.__playwrightInbox, pwChats);
  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
  const unreadConversationsCount = conversations.filter((c) => c.unread > 0).length;

  return NextResponse.json({
    ok: true,
    status: global.__playwrightStatus,
    qrDataUrl: global.__playwrightLastQr,
    inbox: global.__playwrightInbox,
    conversations,
    unreadCount: totalUnreadCount,
    unreadConversationsCount,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageIds, markAllRead, phone } = body;
    if (markAllRead) {
      global.__playwrightInbox = global.__playwrightInbox.map((m) => ({ ...m, read: true }));
    } else if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const lastDigits = cleanPhone.slice(-9);
      global.__playwrightInbox = global.__playwrightInbox.map((m) => {
        const mDigits = (m.fromPhone || '').replace(/\D/g, '');
        return mDigits.includes(lastDigits) || cleanPhone.includes(mDigits)
          ? { ...m, read: true }
          : m;
      });
    } else if (Array.isArray(messageIds)) {
      global.__playwrightInbox = global.__playwrightInbox.map((m) =>
        messageIds.includes(m.id) ? { ...m, read: true } : m
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
