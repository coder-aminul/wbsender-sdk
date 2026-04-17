import type {
  ApiResponse,
  BulkContactOptions,
  Contact,
  ContactListQuery,
  CreateContactOptions,
  IHttpClient,
} from "../types";

export class ContactsResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * List contacts for the authenticated user.
   * The user ID is resolved automatically from the API key — no need to pass it.
   *
   * @example
   * // Default (page 1, server default limit)
   * await client.contacts.list();
   *
   * // Page 2 with 50 items per page
   * await client.contacts.list({ page: 2, limit: 50 });
   *
   * // Full-text search
   * await client.contacts.list({ search: "John" });
   *
   * // Filter by tag slugs (comma-separated)
   * await client.contacts.list({ tags: "vip,customer" });
   *
   * // Sort by name ascending
   * await client.contacts.list({ sort: "name" });
   *
   * // Filter by source + blocked status
   * await client.contacts.list({ source: "website", isBlocked: false });
   */
  list(
    query?: ContactListQuery,
  ): Promise<ApiResponse<{ data: Contact[]; metadata: { total: number } }>> {
    const qs = buildQuery(query);
    return this.http.request("GET", `/me/contacts${qs}`);
  }

  /**
   * Get a single contact by ID.
   */
  get(id: string): Promise<ApiResponse<Contact>> {
    return this.http.request("GET", `/get-contract/${id}`);
  }

  /**
   * Create a new contact.
   * The `author` field is optional — auto-resolved from the API key.
   */
  create(data: CreateContactOptions): Promise<ApiResponse<Contact>> {
    return this.http.request("POST", "/create-contact", data);
  }

  /**
   * Update contact details.
   */
  update(
    id: string,
    data: Partial<CreateContactOptions>,
  ): Promise<ApiResponse<Contact>> {
    return this.http.request("PATCH", `/update-contract/${id}`, data);
  }

  /**
   * Delete a contact.
   */
  delete(id: string): Promise<ApiResponse> {
    return this.http.request("DELETE", `/delete-contract/${id}`);
  }

  /**
   * Bulk-create contacts. Accepts an array of contact objects.
   */
  bulkCreate(data: BulkContactOptions): Promise<ApiResponse> {
    return this.http.request("POST", "/bulk-contact", data);
  }
}

function buildQuery(query?: ContactListQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.sort) params.set("sort", query.sort);
  if (query.search) params.set("search", query.search);
  if (query.tags) params.set("tags", query.tags);
  if (query.source) params.set("source", query.source);
  if (query.isBlocked != null) params.set("isBlocked", String(query.isBlocked));
  const str = params.toString();
  return str ? `?${str}` : "";
}
