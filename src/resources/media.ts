import type { ApiResponse, IHttpClient, MediaFile } from "../types";

export class MediaResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * List all media files belonging to the authenticated user (API key owner).
   */
  list(): Promise<ApiResponse<MediaFile[]>> {
    return this.http.request("GET", "/me/media");
  }

  /**
   * Get a single media file by ID.
   */
  get(id: string): Promise<ApiResponse<MediaFile>> {
    return this.http.request("GET", `/media/${id}`);
  }

  /**
   * Delete a media file by ID.
   */
  delete(id: string): Promise<ApiResponse> {
    return this.http.request("DELETE", `/media/${id}`);
  }
}
