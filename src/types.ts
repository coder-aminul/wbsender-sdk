// ─── Client Config ────────────────────────────────────────────────────────────

export interface WbsenderConfig {
  /** Your API key — starts with wbs_ */
  apiKey: string;
  /**
   * Optional base URL override. Defaults to https://api.wbsender.net/api/v1
   * Useful for self-hosted instances.
   */
  baseUrl?: string;
}

// ─── Internal HTTP ───────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Interface implemented by WbsenderClient and used by resource classes. */
export interface IHttpClient {
  request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T>;
}

// ─── Generic API Response ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationQuery {
  /** Page number — starts at 1. Default: 1 */
  page?: number;
  /** Items per page. Default varies by endpoint. */
  limit?: number;
  /**
   * Sort expression. Prefix a field name with `-` for descending order.
   * Multiple fields separated by comma.
   * @example "-createdAt" // newest first
   * @example "name,-createdAt" // name asc, then newest
   */
  sort?: string;
  /** Full-text search string. Matched against relevant fields (name, email, etc.) */
  search?: string;
}

/**
 * Extended query options for listing contacts.
 * All `PaginationQuery` fields apply plus contact-specific filters.
 */
export interface ContactListQuery extends PaginationQuery {
  /**
   * Comma-separated tag slugs to filter contacts.
   * @example "vip,customer"
   */
  tags?: string;
  /**
   * Comma-separated source values to filter contacts.
   * @example "website,import"
   */
  source?: string;
  /** Filter by blocked status */
  isBlocked?: boolean;
}

// ─── Messages ────────────────────────────────────────────────────────────────

/** Media type hint so the server can pick the correct WhatsApp send path. */
export type MediaType = "image" | "video" | "document";

export interface SendMessageOptions {
  /** Recipient phone number — international format without +. e.g. 8801712345678 */
  to: string;
  /**
   * Text body. Required when `mediaUrl` is not provided.
   * Acts as caption when sent alongside `mediaUrl`.
   */
  message?: string;
  /**
   * Publicly accessible URL of the media to send.
   * Supports image (jpg/png/gif/webp), video (mp4/3gp), and document (pdf/docx…).
   */
  mediaUrl?: string;
  /**
   * Optional explicit media type hint.
   * Inferred automatically from Content-Type if omitted.
   */
  mediaType?: MediaType;
  /**
   * WhatsApp session ID. OPTIONAL when using an API key — the server resolves
   * it automatically from the key owner's account.
   */
  sessionId?: string;
}

export interface SendBulkMessageOptions {
  /** Array of phone numbers — international format without + */
  numbers: string[];
  /** Text body or caption when sending media. */
  message?: string;
  /**
   * Publicly accessible URL of the media to send.
   * Supports image, video, and document.
   */
  mediaUrl?: string;
  /** Optional explicit media type hint. */
  mediaType?: MediaType;
  sessionId?: string;
}

export interface SendBulkGeneralMessageOptions {
  /** Contact tag slugs to send to */
  numberTags: { slug: string }[];
  message?: string;
  mediaUrl?: string;
  variables?: Record<string, string>;
  skip?: number;
  limit?: number;
  sessionId?: string;
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "sent"
  | "completed"
  | "failed"
  | "cancelled";

export type CampaignType = "instant-campaign" | "scheduled-campaign";

export type RecipientType =
  | "all-contacts"
  | "chat-contacts"
  | "group-contacts"
  | "group"
  | "label-groups";

export interface Campaign {
  _id: string;
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  author: string;
  template: string;
  recipientType?: RecipientType;
  contactsTags?: { slug: string; name: string }[];
  skip?: number;
  limit?: number;
  scheduleDateTime?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignProgress {
  total: number;
  current: number;
  successCount: number;
  failedCount: number;
  status: string;
}

export interface CreateCampaignOptions {
  name: string;
  /** Template ID to use for the campaign */
  template: string;
  contactsTags?: { slug: string }[];
  recipient_type?: RecipientType;
  useContactDB?: "mongoDB" | "REDIS";
  skip?: number;
  limit?: number;
  scheduleDateTime?: string;
  timezone?: string;
  type?: CampaignType;
  /**
   * Author/owner user ID. OPTIONAL when using an API key — the server resolves
   * it automatically from the key owner's account.
   */
  author?: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface Template {
  _id: string;
  name: string;
  content: string;
  mediaUrl?: string;
  caption?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateOptions {
  name: string;
  content: string;
  mediaUrl?: string;
  caption?: string;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export interface Contact {
  _id: string;
  name: string;
  phoneNumber: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactOptions {
  name: string;
  phoneNumber: string;
  tags?: string[];
  /** Auto-resolved from API key when omitted */
  author?: string;
}

export interface BulkContactOptions {
  contacts: CreateContactOptions[];
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagOptions {
  name: string;
  slug?: string;
  /** Auto-resolved from API key when omitted */
  author?: string;
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface MediaFile {
  _id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | "message.sent"
  | "message.failed"
  | "campaign.started"
  | "campaign.completed"
  | "campaign.failed"
  | "session.connected"
  | "session.disconnected";

export interface WebhookPayload<T = Record<string, unknown>> {
  event: WebhookEvent;
  tenantId: string;
  timestamp: string;
  data: T;
}
