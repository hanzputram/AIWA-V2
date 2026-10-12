/**
 * AIWA v2 - Playwright WhatsApp Channel Adapter
 *
 * Connects to the local Playwright WhatsApp service (running on port 3000)
 * Allows sending messages, managing sessions, and monitoring QR codes.
 */

import type {
  ChannelAdapter,
  InboundMessage,
  MessageStatus,
  SendResult,
  MediaUploadResult,
} from './adapter.js';

export interface PlaywrightConfig {
  baseUrl?: string; // default http://localhost:3001
  sessionId?: string; // default 'default'
}

export class PlaywrightAdapter implements ChannelAdapter {
  private baseUrl: string;
  private sessionId: string;

  constructor(config: PlaywrightConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.PLAYWRIGHT_SERVICE_URL || 'http://localhost:3001';
    this.sessionId = config.sessionId || 'default';
  }

  verifyWebhook(_query: Record<string, string>): string | null {
    return 'ok';
  }

  verifySignature(_rawBody: Buffer, _signature: string | undefined): boolean {
    return true;
  }

  parseInbound(body: unknown): {
    messages: InboundMessage[];
    statuses: MessageStatus[];
  } {
    const b = body as any;
    const messages: InboundMessage[] = [];
    const statuses: MessageStatus[] = [];

    if (b?.text && b?.from) {
      messages.push({
        waId: String(b.from).replace(/\D/g, ''),
        messageId: b.id || `playwright-${Date.now()}`,
        timestamp: Date.now(),
        type: 'text',
        text: b.text,
        profileName: b.senderName,
      });
    }

    return { messages, statuses };
  }

  async sendText(to: string, text: string): Promise<SendResult> {
    const res = await fetch(`${this.baseUrl}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        to,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Playwright sendText failed: ${res.status} - ${(err as any).error || res.statusText}`);
    }

    const data = (await res.json()) as any;
    return { messageId: data.messageId || `pw-${Date.now()}` };
  }

  async sendDocument(
    to: string,
    doc: {
      mediaId?: string;
      url?: string;
      filename: string;
      caption?: string;
    }
  ): Promise<SendResult> {
    const res = await fetch(`${this.baseUrl}/messages/send-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        to,
        documentUrl: doc.url,
        fileName: doc.filename,
        caption: doc.caption,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Playwright sendDocument failed: ${res.status} - ${(err as any).error || res.statusText}`);
    }

    const data = (await res.json()) as any;
    return { messageId: data.messageId || `pw-doc-${Date.now()}` };
  }

  async sendImage(
    to: string,
    image: {
      mediaId?: string;
      url?: string;
      caption?: string;
    }
  ): Promise<SendResult> {
    return this.sendText(to, `${image.caption || ''} ${image.url || ''}`.trim());
  }

  async uploadMedia(_file: Buffer, _mime: string, _filename: string): Promise<MediaUploadResult> {
    return { mediaId: `pw-media-${Date.now()}` };
  }

  async sendTemplate(to: string, _name: string, _lang: string, params: string[]): Promise<SendResult> {
    const text = params.join('\n');
    return this.sendText(to, text);
  }

  async markRead(_messageId: string): Promise<void> {
    // Playwright marks as read upon viewing chat automatically
  }

  // Session Control APIs
  async startSession(sessionId = this.sessionId): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.json();
  }

  async getSessionStatus(sessionId = this.sessionId): Promise<{
    sessionId: string;
    status: 'disconnected' | 'qr_ready' | 'connected';
    qr?: string;
    userPhone?: string;
    message?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/sessions/${sessionId}/status`);
    return res.json() as any;
  }

  async logoutSession(sessionId = this.sessionId): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sessions/${sessionId}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  }

  async checkHealth(): Promise<{ status: string; active_sessions: number }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json() as any;
  }
}
