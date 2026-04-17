import type {
  ApiResponse,
  CreateTemplateOptions,
  IHttpClient,
  PaginationQuery,
  Template,
} from "../types";

export class TemplatesResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * List all templates for the authenticated user.
   * Resolves the user ID automatically from the API key.
   *
   * @example
   * // First page, 20 per page
   * await client.templates.list({ page: 1, limit: 20 });
   *
   * // Search by name
   * await client.templates.list({ search: "welcome" });
   *
   * // Sort oldest first
   * await client.templates.list({ sort: "createdAt" });
   */
  list(
    query?: PaginationQuery,
  ): Promise<
    ApiResponse<{
      data: Template[];
      metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>
  > {
    const qs = buildQuery(query);
    return this.http.request("GET", `/me/templates${qs}`);
  }

  /**
   * Get a single template by ID.
   */
  get(id: string): Promise<ApiResponse<Template>> {
    return this.http.request("GET", `/get-template/${id}`);
  }

  /**
   * Create a new message template.
   */
  create(data: CreateTemplateOptions): Promise<ApiResponse<Template>> {
    return this.http.request("POST", "/create-template", data);
  }

  /**
   * Update an existing template.
   */
  update(
    id: string,
    data: Partial<CreateTemplateOptions>,
  ): Promise<ApiResponse<Template>> {
    return this.http.request("PATCH", `/update-template/${id}`, data);
  }

  /**
   * Delete a template permanently.
   */
  delete(id: string): Promise<ApiResponse> {
    return this.http.request("DELETE", `/delete-template/${id}`);
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
