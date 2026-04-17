import type { ApiResponse, IHttpClient, SendMessageOptions } from "../types";

export class MessagesResource {
  constructor(private readonly http: IHttpClient) {}

  /**
   * Send a single WhatsApp message — text, image, video, or document.
   *
   * The API queues the message and returns immediately with a jobId.
   * The actual delivery happens asynchronously in the background.
   *
   * @example
   * // Text
   * await client.messages.send({ to: "8801712345678", message: "Hello!" });
   *
   * // Image with caption
   * await client.messages.send({
   *   to: "8801712345678",
   *   mediaUrl: "https://example.com/photo.jpg",
   *   message: "Check this out!",
   * });
   *
   * // Video
   * await client.messages.send({
   *   to: "8801712345678",
   *   mediaUrl: "https://example.com/clip.mp4",
   *   mediaType: "video",
   * });
   *
   * // Document (PDF)
   * await client.messages.send({
   *   to: "8801712345678",
   *   mediaUrl: "https://example.com/invoice.pdf",
   *   mediaType: "document",
   * });
   */
  send(opts: SendMessageOptions): Promise<ApiResponse<{ jobId: string }>> {
    return this.http.request("POST", "/send-message", opts);
  }
}
