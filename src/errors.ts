export class WbsenderError extends Error {
  public readonly status: number;
  public readonly requestId?: string;

  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.name = "WbsenderError";
    this.status = status;
    this.requestId = requestId;
    // Ensure prototype chain is correct for instanceof checks
    Object.setPrototypeOf(this, WbsenderError.prototype);
  }
}
