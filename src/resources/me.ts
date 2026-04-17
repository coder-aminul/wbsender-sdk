import type {
  ApiResponse,
  Campaign,
  IHttpClient,
  MediaFile,
  PaginationQuery,
  Tag,
  Template,
} from "../types";

/**
 * Convenience resource for /me/* endpoints.
 * Every method automatically resolves the authenticated user from the API key.
 */
export class MeResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * List all templates owned by the API key user.
   */
  templates(
    query?: PaginationQuery,
  ): Promise<ApiResponse<{ data: Template[]; metadata: { total: number } }>> {
    const qs = buildQuery(query);
    return this.http.request("GET", `/me/templates${qs}`);
  }

  /**
   * List all campaigns owned by the API key user.
   */
  campaigns(
    query?: PaginationQuery,
  ): Promise<ApiResponse<{ data: Campaign[]; metadata: { total: number } }>> {
    const qs = buildQuery(query);
    return this.http.request("GET", `/me/campaigns${qs}`);
  }

  /**
   * List all tags owned by the API key user.
   */
  tags(): Promise<ApiResponse<Tag[]>> {
    return this.http.request("GET", "/me/tags");
  }

  /**
   * List all media files owned by the API key user.
   */
  media(): Promise<ApiResponse<MediaFile[]>> {
    return this.http.request("GET", "/me/media");
  }
}

function buildQuery(query?: PaginationQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  const str = params.toString();
  return str ? `?${str}` : "";
}
