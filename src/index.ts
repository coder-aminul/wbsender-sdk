// Main client
export { WbsenderClient } from "./client";

// Error class
export { WbsenderError } from "./errors";

// Webhook signature helpers
export { verifySignature, verifySignatureAsync } from "./resources/webhooks";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  // Generic
  ApiResponse,
  BulkContactOptions,
  // Campaigns
  Campaign,
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  // Contacts
  Contact,
  ContactListQuery,
  CreateCampaignOptions,
  CreateContactOptions,
  CreateTagOptions,
  CreateTemplateOptions,
  HttpMethod,
  IHttpClient,
  // Media
  MediaFile,
  MediaType,
  PaginationQuery,
  RecipientType,
  // Messages
  SendMessageOptions,
  // Tags
  Tag,
  // Templates
  Template,
  // Config
  WbsenderConfig,
  // Webhooks
  WebhookEvent,
  WebhookPayload,
} from "./types";
