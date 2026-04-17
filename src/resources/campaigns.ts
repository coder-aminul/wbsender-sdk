import type {
  ApiResponse,
  Campaign,
  CampaignProgress,
  CreateCampaignOptions,
  IHttpClient,
  PaginationQuery,
} from "../types";

export class CampaignsResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * List all campaigns for the authenticated user.
   * Resolves the user ID automatically from the API key.
   *
   * @example
   * // Page 1, 10 per page
   * await client.campaigns.list({ page: 1, limit: 10 });
   *
   * // Search by name
   * await client.campaigns.list({ search: "promo" });
   *
   * // Sort newest first
   * await client.campaigns.list({ sort: "-createdAt" });
   */
  list(
    query?: PaginationQuery,
  ): Promise<ApiResponse<{ data: Campaign[]; metadata: { total: number } }>> {
    const qs = buildQuery(query);
    return this.http.request("GET", `/me/campaigns${qs}`);
  }

  /**
   * Get a single campaign by ID.
   */
  get(id: string): Promise<ApiResponse<Campaign>> {
    return this.http.request("GET", `/get-campaign/${id}`);
  }

  /**
   * Create a new campaign.
   * The `author` field is optional — auto-resolved from the API key.
   */
  create(data: CreateCampaignOptions): Promise<ApiResponse<Campaign>> {
    return this.http.request("POST", "/create-campaign", data);
  }

  /**
   * Update campaign details.
   */
  update(
    id: string,
    data: Partial<CreateCampaignOptions>,
  ): Promise<ApiResponse<Campaign>> {
    return this.http.request("PATCH", `/update-campaign/${id}`, data);
  }

  /**
   * Delete a campaign permanently.
   */
  delete(id: string): Promise<ApiResponse> {
    return this.http.request("DELETE", `/delete-campaign/${id}`);
  }

  /**
   * Trigger immediate sending for a campaign.
   * Returns a job ID — messages are sent asynchronously in the background.
   */
  send(campaignId: string): Promise<ApiResponse<{ jobId: string }>> {
    return this.http.request("POST", `/send-campaign-message/${campaignId}`);
  }

  /**
   * Pause a running campaign.
   */
  pause(id: string): Promise<ApiResponse> {
    return this.http.request("POST", `/campaign/${id}/pause`);
  }

  /**
   * Resume a paused campaign.
   */
  resume(id: string): Promise<ApiResponse> {
    return this.http.request("POST", `/campaign/${id}/resume`);
  }

  /**
   * Cancel a running or paused campaign.
   */
  cancel(id: string): Promise<ApiResponse> {
    return this.http.request("POST", `/campaign/${id}/cancel`);
  }

  /**
   * Get real-time progress for a running campaign.
   */
  progress(id: string): Promise<ApiResponse<CampaignProgress>> {
    return this.http.request("GET", `/campaign/${id}/progress`);
  }
}

function buildQuery(query?: PaginationQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.sort) params.set("sort", query.sort);
  if (query.search) params.set("search", query.search);
  const str = params.toString();
  return str ? `?${str}` : "";
}
