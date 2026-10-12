/**
 * AIWA v2 - WhatsApp Cloud API Adapter
 *
 * Implementation of ChannelAdapter for Meta's WhatsApp Business Cloud API.
 */

import crypto from 'node:crypto';
import type {
  ChannelAdapter,
  InboundMessage,
  MessageStatus,
  SendResult,
  MediaUploadResult,
} from './adapter.js';

export interface WhatsAppCloudConfig {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  graphVersion: string;
}

export class WhatsAppCloudAdapter implements ChannelAdapter {
  private baseUrl: string;

  constructor(private config: WhatsAppCloudConfig) {
    this.baseUrl = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}`;
  }

  verifyWebhook(query: Record<string, string>): string | null {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === this.config.verifyToken) {
      return challenge || null;
    }
    return null;
  }

  verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature?.startsWith('sha256=')) return false;
    const expected = crypto
      .createHmac('sha256', this.config.appSecret)
      .update(rawBody)
      .digest('hex');
    const given = signature.slice(7);
    return (
      given.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
    );
  }

  parseInbound(body: unknown): {
    messages: InboundMessage[];
    statuses: MessageStatus[];
  } {
    const messages: InboundMessage[] = [];
    const statuses: MessageStatus[] = [];

    const payload = body as any;
    if (!payload?.entry) return { messages, statuses };

    for (const entry of payload.entry) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;

        // Parse messages
        for (const msg of value.messages ?? []) {
          const contact = value.contacts?.find((c: any) => c.wa_id === msg.from);
          const parsed: InboundMessage = {
            waId: msg.from,
            messageId: msg.id,
            timestamp: parseInt(msg.timestamp) * 1000,
            type: msg.type,
            profileName: contact?.profile?.name,
          };

          switch (msg.type) {
            case 'text':
              parsed.text = msg.text?.body;
              break;
            case 'image':
              parsed.mediaId = msg.image?.id;
              parsed.mimeType = msg.image?.mime_type;
              parsed.caption = msg.image?.caption;
              break;
            case 'audio':
              parsed.mediaId = msg.audio?.id;
              parsed.mimeType = msg.audio?.mime_type;
              break;
            case 'document':
              parsed.mediaId = msg.document?.id;
              parsed.mimeType = msg.document?.mime_type;
              parsed.caption = msg.document?.caption;
              break;
            case 'location':
              parsed.latitude = msg.location?.latitude;
              parsed.longitude = msg.location?.longitude;
              break;
            case 'interactive':
              parsed.text =
                msg.interactive?.button_reply?.title ??
                msg.interactive?.list_reply?.title;
              break;
          }

          messages.push(parsed);
        }

        // Parse statuses
        for (const st of value.statuses ?? []) {
          statuses.push({
            messageId: st.id,
            status: st.status,
            timestamp: parseInt(st.timestamp) * 1000,
            errors: st.errors,
          });
        }
      }
    }

    return { messages, statuses };
  }

  async sendText(to: string, text: string): Promise<SendResult> {
    const res = await this.apiCall('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    });
    return { messageId: res.messages?.[0]?.id ?? '' };
  }

  async sendDocument(
    to: string,
    doc: { mediaId?: string; url?: string; filename: string; caption?: string }
  ): Promise<SendResult> {
    const document: any = { filename: doc.filename };
    if (doc.mediaId) document.id = doc.mediaId;
    if (doc.url) document.link = doc.url;
    if (doc.caption) document.caption = doc.caption;

    const res = await this.apiCall('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document,
    });
    return { messageId: res.messages?.[0]?.id ?? '' };
  }

  async sendImage(
    to: string,
    image: { mediaId?: string; url?: string; caption?: string }
  ): Promise<SendResult> {
    const img: any = {};
    if (image.mediaId) img.id = image.mediaId;
    if (image.url) img.link = image.url;
    if (image.caption) img.caption = image.caption;

    const res = await this.apiCall('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: img,
    });
    return { messageId: res.messages?.[0]?.id ?? '' };
  }

  async uploadMedia(file: Buffer, mime: string, filename: string): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('file', new Blob([file], { type: mime }), filename);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mime);

    const url = `https://graph.facebook.com/${this.config.graphVersion}/${this.config.phoneNumberId}/media`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.accessToken}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`Upload media failed: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return { mediaId: data.id };
  }

  async sendTemplate(
    to: string,
    name: string,
    lang: string,
    params: string[]
  ): Promise<SendResult> {
    const components: any[] = [];
    if (params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map((p) => ({ type: 'text', text: p })),
      });
    }

    const res = await this.apiCall('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: lang },
        components,
      },
    });
    return { messageId: res.messages?.[0]?.id ?? '' };
  }

  async markRead(messageId: string): Promise<void> {
    await this.apiCall('/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }

  async sendTyping(to: string): Promise<void> {
    // WhatsApp Cloud API doesn't have a direct typing indicator
    // This is a no-op placeholder
  }

  private async apiCall(path: string, body: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`WhatsApp API error ${res.status}: ${error}`);
    }

    return res.json();
  }
}
