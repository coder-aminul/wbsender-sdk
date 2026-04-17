import { WbsenderError } from "./errors";
import { CampaignsResource } from "./resources/campaigns";
import { ContactsResource } from "./resources/contacts";
import { MeResource } from "./resources/me";
import { MediaResource } from "./resources/media";
import { MessagesResource } from "./resources/messages";
import { TagsResource } from "./resources/tags";
import { TemplatesResource } from "./resources/templates";
import { WebhooksResource } from "./resources/webhooks";
import type { HttpMethod, WbsenderConfig } from "./types";

const DEFAULT_BASE_URL = "https://wbapi.apiservicecenter.xyz/api/v1";

export class WbsenderClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /** Send individual and bulk WhatsApp messages */
  readonly messages: MessagesResource;
  /** Manage and trigger campaigns */
  readonly campaigns: CampaignsResource;
  /** Manage message templates */
  readonly templates: TemplatesResource;
  /** Manage contacts */
  readonly contacts: ContactsResource;
  /** Manage contact tags */
  readonly tags: TagsResource;
  /** Access the media library */
  readonly media: MediaResource;
  /**
   * Self-resolving shortcuts — no authorId required.
   * Use these when you don't have the user ID.
   */
  readonly me: MeResource;
  /** Webhook signature verification utilities */
  readonly webhooks: WebhooksResource;

  constructor(config: WbsenderConfig) {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("WbsenderClient: apiKey is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

    // Instantiate resource classes — each receives a bound request function
    this.messages = new MessagesResource(this);
    this.campaigns = new CampaignsResource(this);
    this.templates = new TemplatesResource(this);
    this.contacts = new ContactsResource(this);
    this.tags = new TagsResource(this);
    this.media = new MediaResource(this);
    this.me = new MeResource(this);
    this.webhooks = new WebhooksResource(this);
  }

  /**
   * Low-level HTTP helper used by all resource classes.
   * Throws WbsenderError on non-2xx responses.
   */
  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let json: Record<string, unknown>;
    try {
      json = (await response.json()) as Record<string, unknown>;
    } catch {
      json = { message: response.statusText };
    }

    if (!response.ok) {
      throw new WbsenderError(
        response.status,
        (json?.message as string) ?? "Request failed",
      );
    }

    return json as T;
  }
}
