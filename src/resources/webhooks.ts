import type { IHttpClient } from "../types";

/**
 * Webhook signature verification utilities.
 *
 * - `verifySignature`      — Synchronous, uses Node.js `crypto` module (Node 18+).
 * - `verifySignatureAsync` — Asynchronous, uses Web Crypto API. Works in Node 18+,
 *                            Next.js Edge Runtime, Cloudflare Workers, and browsers.
 */

/**
 * Resource class exposed on `client.webhooks`.
 * Delegates to the standalone helper functions below.
 */
export class WebhooksResource {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_http: IHttpClient) {}

  /** @see {@link verifySignature} */
  verifySignature(
    rawBody: string,
    signatureHeader: string,
    secret: string,
  ): boolean {
    return verifySignature(rawBody, signatureHeader, secret);
  }

  /** @see {@link verifySignatureAsync} */
  verifySignatureAsync(
    rawBody: string,
    signatureHeader: string,
    secret: string,
  ): Promise<boolean> {
    return verifySignatureAsync(rawBody, signatureHeader, secret);
  }
}

/**
 * Verify a WbSender webhook signature **synchronously** using Node.js `crypto`.
 *
 * Use this in Express / Next.js API routes running on the Node.js runtime.
 *
 * @param rawBody         - The raw request body as a string (do NOT JSON.parse it first).
 * @param signatureHeader - The value of the `x-wbsender-signature` request header.
 * @param secret          - Your webhook secret (set when creating the webhook).
 * @returns `true` if the signature is valid, `false` otherwise.
 *
 * @example
 * import express from "express";
 * import { verifySignature } from "@wbsender/sdk";
 *
 * app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
 *   const valid = verifySignature(
 *     req.body.toString(),
 *     req.headers["x-wbsender-signature"] as string,
 *     process.env.WEBHOOK_SECRET!,
 *   );
 *   if (!valid) return res.status(401).send("Unauthorized");
 *   // process req.body ...
 *   res.sendStatus(200);
 * });
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  try {
    // Dynamic require keeps edge-runtime bundlers from trying to include node:crypto
    // This function should only be called in a Node.js environment.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createHmac, timingSafeEqual } =
      require("crypto") as typeof import("crypto");
    const expected =
      "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Verify a WbSender webhook signature **asynchronously** using the Web Crypto API.
 *
 * This works in all environments: Node 18+, Next.js Edge Runtime,
 * Cloudflare Workers, and browsers.
 *
 * @param rawBody         - The raw request body as a string.
 * @param signatureHeader - The value of the `x-wbsender-signature` request header.
 * @param secret          - Your webhook secret.
 * @returns Promise resolving to `true` if the signature is valid.
 *
 * @example
 * // Next.js Edge API route
 * import { verifySignatureAsync } from "@wbsender/sdk";
 *
 * export const runtime = "edge";
 *
 * export async function POST(req: Request) {
 *   const body = await req.text();
 *   const valid = await verifySignatureAsync(
 *     body,
 *     req.headers.get("x-wbsender-signature") ?? "",
 *     process.env.WEBHOOK_SECRET!,
 *   );
 *   if (!valid) return new Response("Unauthorized", { status: 401 });
 *   // process body ...
 *   return new Response("OK");
 * }
 */
export async function verifySignatureAsync(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody),
    );
    const hexHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = "sha256=" + hexHash;

    // Constant-time comparison to prevent timing attacks
    if (signatureHeader.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= signatureHeader.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
