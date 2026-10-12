export type {
  ChannelAdapter, InboundMessage, MessageStatus,
  SendResult, MediaUploadResult
} from './adapter.js';

export { WhatsAppCloudAdapter } from './whatsapp-cloud.js';
export type { WhatsAppCloudConfig } from './whatsapp-cloud.js';
export { PlaywrightAdapter } from './playwright.js';
export type { PlaywrightConfig } from './playwright.js';
