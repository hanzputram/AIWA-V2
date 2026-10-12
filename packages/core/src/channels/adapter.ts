/**
 * AIWA v2 - WhatsApp Channel Adapter Interface
 *
 * Abstracts the WhatsApp provider so business logic is decoupled
 * from the specific API (Cloud API, Fonnte, Qontak, etc.)
 */

export interface InboundMessage {
  waId: string;
  messageId: string;
  timestamp: number;
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'interactive' | 'reaction';
  text?: string;
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  profileName?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
}

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  errors?: { code: number; title: string }[];
}

export interface SendResult {
  messageId: string;
}

export interface MediaUploadResult {
  mediaId: string;
}

export interface ChannelAdapter {
  /** Verify webhook challenge (GET request) */
  verifyWebhook(query: Record<string, string>): string | null;

  /** Verify webhook signature (POST request) */
  verifySignature(rawBody: Buffer, signature: string | undefined): boolean;

  /** Parse inbound webhook payload */
  parseInbound(body: unknown): {
    messages: InboundMessage[];
    statuses: MessageStatus[];
  };

  /** Send a text message */
  sendText(to: string, text: string): Promise<SendResult>;

  /** Send a document (PDF, etc.) */
  sendDocument(to: string, doc: {
    mediaId?: string;
    url?: string;
    filename: string;
    caption?: string;
  }): Promise<SendResult>;

  /** Send an image */
  sendImage(to: string, image: {
    mediaId?: string;
    url?: string;
    caption?: string;
  }): Promise<SendResult>;

  /** Upload media to WhatsApp */
  uploadMedia(file: Buffer, mime: string, filename: string): Promise<MediaUploadResult>;

  /** Send a pre-approved template message */
  sendTemplate(to: string, name: string, lang: string, params: string[]): Promise<SendResult>;

  /** Mark a message as read */
  markRead(messageId: string): Promise<void>;

  /** Send typing indicator */
  sendTyping?(to: string): Promise<void>;
}
