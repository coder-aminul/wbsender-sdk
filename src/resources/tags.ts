import type { ApiResponse, CreateTagOptions, IHttpClient, Tag } from "../types";

export class TagsResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * List all tags belonging to the authenticated user (API key owner).
   */
  list(): Promise<ApiResponse<Tag[]>> {
    return this.http.request("GET", "/me/tags");
  }

  /**
   * Get a single tag by its slug.
   */
  get(slug: string): Promise<ApiResponse<Tag>> {
    return this.http.request("GET", `/get-tag/${slug}`);
  }

  /**
   * Create a new tag.
   * The `author` field is optional — auto-resolved from the API key.
   */
  create(data: CreateTagOptions): Promise<ApiResponse<Tag>> {
    return this.http.request("POST", "/create-tag", data);
  }

  /**
   * Delete a tag by its ID.
   */
  delete(id: string): Promise<ApiResponse> {
    return this.http.request("DELETE", `/delete-tag/${id}`);
  }
}
