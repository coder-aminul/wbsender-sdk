# @wbsender/sdk

Official JavaScript / TypeScript SDK for the **WbSender WhatsApp Marketing API**.

- **Zero runtime dependencies** — uses the native `fetch` API
- **Full TypeScript support** — CJS + ESM + `.d.ts` bundled
- **Works everywhere** — Node.js 18+, Next.js (App Router & Pages Router), Edge Runtime, Cloudflare Workers

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Resources](#resources)
  - [Messages](#-messages)
  - [Contacts](#-contacts)
  - [Templates](#-templates)
  - [Campaigns](#-campaigns)
  - [Tags](#-tags)
  - [Media](#-media)
- [Webhooks](#-webhooks)
  - [Event Reference](#event-reference)
  - [Setup in Express](#setup-in-express)
  - [Setup in Next.js](#setup-in-nextjs-app-router)
  - [Setup in Next.js Edge Runtime](#setup-in-nextjs-edge-runtime)
- [Usage in Express Backend](#full-example--express-backend)
- [Usage in Next.js](#full-example--nextjs-app-router)

---

## Installation

```bash
npm install @wbsender/sdk
# or
pnpm add @wbsender/sdk
# or
yarn add @wbsender/sdk
```

> **Requirements:** Node.js ≥ 18 (uses native `fetch` and Web Crypto API).

---

## Quick Start

```ts
import { WbsenderClient } from "@wbsender/sdk";

const client = new WbsenderClient({
  apiKey: process.env.WBSENDER_API_KEY!, // starts with wbs_
});

// Send a WhatsApp message
const result = await client.messages.send({
  to: "8801712345678",
  message: "Hello from the SDK!",
});

console.log(result.data.jobId); // message is queued, jobId returned
```

---

## Configuration

```ts
const client = new WbsenderClient({
  apiKey: "wbs_xxxxxxxxxxxx", // required — starts with wbs_
  baseUrl: "https://wbapi.apiservicecenter.xyz/api/v1", // optional — default shown; change for self-hosted
});
```

---

## Error Handling

All SDK methods throw a `WbsenderError` on non-2xx responses. Always wrap calls in `try/catch`.

```ts
import { WbsenderClient, WbsenderError } from "@wbsender/sdk";

try {
  await client.messages.send({ to: "880...", message: "Hi" });
} catch (err) {
  if (err instanceof WbsenderError) {
    console.error(err.status); // HTTP status code, e.g. 400, 401, 429
    console.error(err.message); // Human-readable error message from the API
  }
}
```

---

## Resources

### 💬 Messages

Send a WhatsApp message — text, image, video, or document. The API queues the delivery and responds immediately with a `jobId`. The actual message is sent asynchronously in the background.

```ts
// ── Text message ──────────────────────────────────────────
await client.messages.send({
  to: "8801712345678",
  message: "Hello! 👋",
});

// ── Image with caption ────────────────────────────────────
await client.messages.send({
  to: "8801712345678",
  mediaUrl: "https://example.com/banner.jpg",
  message: "Check out our latest offer!",
});

// ── Video ─────────────────────────────────────────────────
await client.messages.send({
  to: "8801712345678",
  mediaUrl: "https://example.com/promo.mp4",
  mediaType: "video",
});

// ── Document (PDF / DOCX / etc.) ──────────────────────────
await client.messages.send({
  to: "8801712345678",
  mediaUrl: "https://example.com/invoice.pdf",
  mediaType: "document",
});
```

**Response:**

```json
{
  "status": true,
  "message": "Message queued successfully.",
  "data": { "jobId": "msg-session123-8801712345678-1713340000000" }
}
```

> **Note:** The `jobId` can be used to track delivery status via webhooks (`message.sent` / `message.failed`).

**`SendMessageOptions`**

| Field       | Type                               | Required | Description                                                                      |
| ----------- | ---------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `to`        | `string`                           | ✅       | Recipient phone number in international format without `+`. e.g. `8801712345678` |
| `message`   | `string`                           | —        | Text body. Required when no `mediaUrl`. Used as caption when sent with media.    |
| `mediaUrl`  | `string`                           | —        | Publicly accessible URL of image / video / document                              |
| `mediaType` | `"image" \| "video" \| "document"` | —        | Optional hint. Auto-detected from Content-Type if omitted.                       |
| `sessionId` | `string`                           | —        | WhatsApp session ID. Auto-resolved from API key when omitted.                    |

---

### 👥 Contacts

```ts
// ── List contacts (with filters) ──────────────────────────
const { data } = await client.contacts.list({
  page: 1,
  limit: 50,
  search: "Rahim", // full-text search: name, email, phone
  tags: "vip,customer", // filter by tag slugs (comma-separated)
  source: "website", // filter by source
  sort: "-createdAt", // newest first; remove "-" for ascending
  isBlocked: false,
});
// data.data  → Contact[]
// data.metadata.total → total count

// ── Get single contact ────────────────────────────────────
const contact = await client.contacts.get("CONTACT_ID");

// ── Create contact ────────────────────────────────────────
await client.contacts.create({
  name: "Rahim Uddin",
  phoneNumber: "8801700000000",
  tags: ["vip"],
});

// ── Update contact ────────────────────────────────────────
await client.contacts.update("CONTACT_ID", { name: "Rahim Ahmed" });

// ── Delete contact ────────────────────────────────────────
await client.contacts.delete("CONTACT_ID");

// ── Bulk import contacts ──────────────────────────────────
await client.contacts.bulkCreate({
  contacts: [
    { name: "Alice", phoneNumber: "8801700000001" },
    { name: "Bob", phoneNumber: "8801700000002", tags: ["beta"] },
  ],
});
```

**`ContactListQuery`** — all fields optional

| Field       | Type      | Description                                                           |
| ----------- | --------- | --------------------------------------------------------------------- |
| `page`      | `number`  | Page number, starts at `1`                                            |
| `limit`     | `number`  | Items per page                                                        |
| `search`    | `string`  | Full-text search across name, email, phone number                     |
| `sort`      | `string`  | Field name. Prefix with `-` for descending. e.g. `-createdAt`, `name` |
| `tags`      | `string`  | Comma-separated tag slugs. e.g. `"vip,customer"`                      |
| `source`    | `string`  | Comma-separated source values. e.g. `"website,import"`                |
| `isBlocked` | `boolean` | Filter by blocked status                                              |

---

### 📋 Templates

```ts
// ── List templates ────────────────────────────────────────
const { data } = await client.templates.list({
  page: 1,
  limit: 20,
  search: "welcome",
  sort: "-createdAt",
});
// data.data          → Template[]
// data.metadata      → { total, page, limit, totalPages }

// ── Get single template ───────────────────────────────────
const tpl = await client.templates.get("TEMPLATE_ID");

// ── Create template ───────────────────────────────────────
await client.templates.create({
  name: "Welcome Message",
  content: "Hello {{name}}, welcome to our service! 🎉",
});

// ── Create template with media ────────────────────────────
await client.templates.create({
  name: "Promo Banner",
  content: "Exclusive offer just for you!",
  mediaUrl: "https://example.com/promo.jpg",
  caption: "Limited time offer",
});

// ── Update template ───────────────────────────────────────
await client.templates.update("TEMPLATE_ID", {
  content: "Updated message content",
});

// ── Delete template ───────────────────────────────────────
await client.templates.delete("TEMPLATE_ID");
```

---

### 📣 Campaigns

```ts
// ── List campaigns ────────────────────────────────────────
const { data } = await client.campaigns.list({
  page: 1,
  limit: 10,
  search: "promo",
  sort: "-createdAt",
});

// ── Get single campaign ───────────────────────────────────
const campaign = await client.campaigns.get("CAMPAIGN_ID");

// ── Create a campaign ─────────────────────────────────────
await client.campaigns.create({
  name: "Eid Sale 2025",
  template: "TEMPLATE_ID",
  type: "instant-campaign",
  contactsTags: [{ slug: "customer" }],
});

// ── Create a scheduled campaign ──────────────────────────
await client.campaigns.create({
  name: "Scheduled Promo",
  template: "TEMPLATE_ID",
  type: "scheduled-campaign",
  contactsTags: [{ slug: "vip" }],
  scheduleDateTime: "2025-12-25T10:00:00",
  timezone: "Asia/Dhaka",
});

// ── Trigger campaign immediately ──────────────────────────
const { data } = await client.campaigns.send("CAMPAIGN_ID");
console.log(data.jobId); // track via campaign.started webhook

// ── Pause / Resume / Cancel ───────────────────────────────
await client.campaigns.pause("CAMPAIGN_ID");
await client.campaigns.resume("CAMPAIGN_ID");
await client.campaigns.cancel("CAMPAIGN_ID");

// ── Real-time progress ────────────────────────────────────
const { data: progress } = await client.campaigns.progress("CAMPAIGN_ID");
console.log(progress);
// {
//   total: 500,
//   current: 120,
//   successCount: 100,
//   failedCount: 20,
//   status: "running"
// }

// ── Update campaign ───────────────────────────────────────
await client.campaigns.update("CAMPAIGN_ID", { name: "Eid Sale Updated" });

// ── Delete campaign ───────────────────────────────────────
await client.campaigns.delete("CAMPAIGN_ID");
```

---

### 🏷️ Tags

```ts
// ── List all tags ─────────────────────────────────────────
const { data: tags } = await client.tags.list();

// ── Get single tag by slug ────────────────────────────────
const tag = await client.tags.get("vip");

// ── Create tag ────────────────────────────────────────────
await client.tags.create({ name: "VIP Customers", slug: "vip" });

// ── Delete tag ────────────────────────────────────────────
await client.tags.delete("TAG_ID");
```

---

### 🖼️ Media

```ts
// ── List media library ────────────────────────────────────
const { data: files } = await client.media.list();

// ── Get single file ───────────────────────────────────────
const file = await client.media.get("FILE_ID");

// ── Delete file ───────────────────────────────────────────
await client.media.delete("FILE_ID");
```

---

## 🔔 Webhooks

WbSender fires webhook events to your URL when things happen asynchronously (message delivered, campaign finished, session state changed).

All requests from WbSender include an `x-wbsender-signature` header — an HMAC-SHA256 signature of the raw request body. **Always verify this signature** before processing events.

### Event Reference

| Event                  | When it fires                                      |
| ---------------------- | -------------------------------------------------- |
| `message.sent`         | A queued message was successfully delivered        |
| `message.failed`       | A message could not be delivered after all retries |
| `campaign.started`     | A campaign began sending                           |
| `campaign.completed`   | A campaign finished sending to all recipients      |
| `campaign.failed`      | A campaign crashed with an unrecoverable error     |
| `session.connected`    | A WhatsApp session came online                     |
| `session.disconnected` | A WhatsApp session went offline                    |

---

### Webhook Payload Structure

Every webhook POST body has this top-level shape:

```json
{
  "event": "message.sent",
  "tenantId": "session_abc123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": { ... }
}
```

#### `message.sent`

```json
{
  "event": "message.sent",
  "tenantId": "session_abc123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "to": "8801712345678",
    "jobId": "msg-session_abc123-8801712345678-1713340000000"
  }
}
```

#### `message.failed`

```json
{
  "event": "message.failed",
  "tenantId": "session_abc123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "to": "8801712345678",
    "jobId": "msg-session_abc123-8801712345678-1713340000000",
    "error": "detached Frame",
    "reason": "session_broken"
  }
}
```

#### `campaign.started`

```json
{
  "event": "campaign.started",
  "tenantId": "user_id_123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "campaignId": "66f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Eid Sale 2025",
    "total": 500
  }
}
```

#### `campaign.completed`

```json
{
  "event": "campaign.completed",
  "tenantId": "user_id_123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "campaignId": "66f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Eid Sale 2025",
    "total": 500,
    "sent": 487,
    "failed": 13
  }
}
```

#### `campaign.failed`

```json
{
  "event": "campaign.failed",
  "tenantId": "user_id_123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "campaignId": "66f1a2b3c4d5e6f7a8b9c0d1",
    "error": "WhatsApp session disconnected mid-campaign"
  }
}
```

#### `session.connected`

```json
{
  "event": "session.connected",
  "tenantId": "session_abc123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "phone": "8801712345678",
    "name": "My Business Account"
  }
}
```

#### `session.disconnected`

```json
{
  "event": "session.disconnected",
  "tenantId": "session_abc123",
  "timestamp": "2025-04-17T10:30:00.000Z",
  "data": {
    "reason": "LOGOUT"
  }
}
```

---

### Setup in Express

```ts
import express from "express";
import { verifySignature, WbsenderError } from "@wbsender/sdk";
import type { WebhookPayload } from "@wbsender/sdk";

const app = express();

// ⚠️ IMPORTANT: Use express.raw() — NOT express.json() — on webhook routes.
// Signature verification requires the raw, unmodified request body string.
app.post(
  "/webhooks/wbsender",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const rawBody = req.body.toString();
    const signature = req.headers["x-wbsender-signature"] as string;

    // 1. Verify signature
    const isValid = verifySignature(
      rawBody,
      signature,
      process.env.WEBHOOK_SECRET!,
    );
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 2. Parse and handle event
    const payload = JSON.parse(rawBody) as WebhookPayload;

    switch (payload.event) {
      case "message.sent":
        console.log("✅ Message delivered to", payload.data.to);
        break;

      case "message.failed":
        console.error(
          "❌ Message failed to",
          payload.data.to,
          "—",
          payload.data.error,
        );
        break;

      case "campaign.started":
        console.log(
          `🚀 Campaign "${payload.data.name}" started. Total: ${payload.data.total}`,
        );
        break;

      case "campaign.completed":
        console.log(
          `🎉 Campaign "${payload.data.name}" done. Sent: ${payload.data.sent}/${payload.data.total}`,
        );
        break;

      case "campaign.failed":
        console.error(`💥 Campaign failed:`, payload.data.error);
        break;

      case "session.connected":
        console.log(
          `📱 Session connected: ${payload.data.name} (${payload.data.phone})`,
        );
        break;

      case "session.disconnected":
        console.log(`📵 Session disconnected. Reason: ${payload.data.reason}`);
        break;
    }

    // 3. Always respond 200 quickly
    res.sendStatus(200);
  },
);
```

---

### Setup in Next.js (App Router)

> Uses the **Node.js runtime** (default). Signature verified with synchronous `verifySignature`.

```ts
// app/api/webhooks/wbsender/route.ts
import { verifySignature } from "@wbsender/sdk";
import type { WebhookPayload } from "@wbsender/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-wbsender-signature") ?? "";

  // 1. Verify signature
  const isValid = verifySignature(
    rawBody,
    signature,
    process.env.WEBHOOK_SECRET!,
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse and handle
  const payload = JSON.parse(rawBody) as WebhookPayload;

  switch (payload.event) {
    case "message.sent":
      // update your DB, notify your UI, etc.
      break;

    case "campaign.completed":
      // send a summary email, update campaign status in your DB, etc.
      break;

    // handle other events...
  }

  return NextResponse.json({ received: true });
}
```

---

### Setup in Next.js (Edge Runtime)

> Uses `verifySignatureAsync` — works in Edge Runtime, Cloudflare Workers, and browsers.

```ts
// app/api/webhooks/wbsender/route.ts
import { verifySignatureAsync } from "@wbsender/sdk";
import type { WebhookPayload } from "@wbsender/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // ← Edge Runtime

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-wbsender-signature") ?? "";

  // 1. Verify signature (async, Web Crypto)
  const isValid = await verifySignatureAsync(
    rawBody,
    signature,
    process.env.WEBHOOK_SECRET!,
  );
  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse and handle
  const payload = JSON.parse(rawBody) as WebhookPayload;

  switch (payload.event) {
    case "message.sent":
      // handle
      break;
    case "campaign.completed":
      // handle
      break;
  }

  return new Response("OK");
}
```

---

## Full Example — Express Backend

```ts
// server.ts
import express from "express";
import { WbsenderClient, WbsenderError, verifySignature } from "@wbsender/sdk";
import type { WebhookPayload } from "@wbsender/sdk";

const app = express();
app.use(express.json()); // standard JSON parsing for all other routes

const client = new WbsenderClient({
  apiKey: process.env.WBSENDER_API_KEY!,
});

// ── Send a message ─────────────────────────────────────────────────────────
app.post("/send", async (req, res) => {
  try {
    const { phone, text } = req.body;
    const result = await client.messages.send({ to: phone, message: text });
    res.json({ jobId: result.data.jobId });
  } catch (err) {
    if (err instanceof WbsenderError) {
      res.status(err.status).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── List contacts with search ──────────────────────────────────────────────
app.get("/contacts", async (req, res) => {
  try {
    const { page, limit, search, tags } = req.query as Record<string, string>;
    const result = await client.contacts.list({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      tags,
    });
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// ── Trigger a campaign ─────────────────────────────────────────────────────
app.post("/campaigns/:id/send", async (req, res) => {
  try {
    const result = await client.campaigns.send(req.params.id);
    res.json({ jobId: result.data.jobId });
  } catch (err) {
    if (err instanceof WbsenderError) {
      res.status(err.status).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Failed to trigger campaign" });
    }
  }
});

// ── Webhook handler ────────────────────────────────────────────────────────
app.post(
  "/webhooks/wbsender",
  express.raw({ type: "application/json" }), // override json middleware for this route
  (req, res) => {
    const rawBody = req.body.toString();
    const sig = req.headers["x-wbsender-signature"] as string;

    if (!verifySignature(rawBody, sig, process.env.WEBHOOK_SECRET!)) {
      return res.status(401).send("Unauthorized");
    }

    const { event, data } = JSON.parse(rawBody) as WebhookPayload;

    if (event === "message.sent") {
      console.log("Delivered to:", data.to);
    }
    if (event === "campaign.completed") {
      console.log(`Campaign done: ${data.sent}/${data.total} sent`);
    }

    res.sendStatus(200);
  },
);

app.listen(3000, () => console.log("Server running on :3000"));
```

---

## Full Example — Next.js (App Router)

```ts
// lib/wbsender.ts  — shared singleton client
import { WbsenderClient } from "@wbsender/sdk";

export const wbsender = new WbsenderClient({
  apiKey: process.env.WBSENDER_API_KEY!,
});
```

```ts
// app/api/send-message/route.ts
import { wbsender } from "@/lib/wbsender";
import { WbsenderError } from "@wbsender/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { phone, message } = await req.json();

  try {
    const result = await wbsender.messages.send({ to: phone, message });
    return NextResponse.json({ jobId: result.data.jobId });
  } catch (err) {
    if (err instanceof WbsenderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
```

```ts
// app/api/contacts/route.ts
import { wbsender } from "@/lib/wbsender";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const result = await wbsender.contacts.list({
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 20,
    search: searchParams.get("search") ?? undefined,
    tags: searchParams.get("tags") ?? undefined,
    sort: searchParams.get("sort") ?? "-createdAt",
  });

  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await wbsender.contacts.create(body);
  return NextResponse.json(result.data, { status: 201 });
}
```

```ts
// app/api/webhooks/wbsender/route.ts
import { verifySignature } from "@wbsender/sdk";
import type { WebhookPayload } from "@wbsender/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-wbsender-signature") ?? "";

  if (!verifySignature(rawBody, signature, process.env.WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as WebhookPayload;

  switch (payload.event) {
    case "message.sent":
      // await db.messages.markDelivered(payload.data.jobId);
      break;
    case "message.failed":
      // await db.messages.markFailed(payload.data.jobId, payload.data.error);
      break;
    case "campaign.completed":
      // await db.campaigns.updateStats(payload.data.campaignId, payload.data);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## TypeScript Types

All types are exported from `@wbsender/sdk`:

```ts
import type {
  // Config
  WbsenderConfig,

  // API Response wrapper
  ApiResponse, // { status: boolean; message: string; data: T }

  // Webhooks
  WebhookPayload, // { event, tenantId, timestamp, data }
  WebhookEvent, // union of all event strings

  // Messages
  SendMessageOptions,
  MediaType, // "image" | "video" | "document"

  // Contacts
  Contact,
  ContactListQuery,
  CreateContactOptions,
  BulkContactOptions,

  // Templates
  Template,
  CreateTemplateOptions,

  // Campaigns
  Campaign,
  CampaignStatus,
  CampaignType,
  CampaignProgress,
  CreateCampaignOptions,
  RecipientType,

  // Tags
  Tag,
  CreateTagOptions,

  // Media
  MediaFile,

  // Pagination
  PaginationQuery, // { page?, limit?, sort?, search? }
} from "@wbsender/sdk";
```

---

## Environment Variables

| Variable           | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `WBSENDER_API_KEY` | Your API key — starts with `wbs_`                                           |
| `WEBHOOK_SECRET`   | The secret you set when creating a webhook endpoint in the Developer Portal |

| Option    | Type     | Required | Description                            |
| --------- | -------- | -------- | -------------------------------------- |
| `apiKey`  | `string` | ✅       | Your API key from the Developer Portal |
| `baseUrl` | `string` | ❌       | Override for self-hosted instances     |

---

## Resources

### `client.messages`

```ts
// Send a text or media message
await client.messages.send({
  to: "8801712345678",
  message: "Hello!",
  // mediaUrl: "https://example.com/image.jpg",
  // caption: "Check this out",
  // sessionId: "xxx",  ← optional; auto-resolved from API key
});

// Send a button message
await client.messages.sendButton({ to: "8801712345678" });

// Send to specific numbers (bulk)
await client.messages.sendBulk({
  numbers: ["8801712345678", "8801987654321"],
  message: "Bulk message!",
});

// Send to contacts in a tag (bulk general)
await client.messages.sendBulkGeneral({
  numberTags: [{ slug: "vip-customers" }],
  message: "Hi {{name}}!",
  variables: { name: "Customer" },
});
```

### `client.campaigns`

```ts
// List campaigns (paginated)
const { data } = await client.campaigns.list({ page: 1, limit: 20 });

// Get single campaign
const campaign = await client.campaigns.get("CAMPAIGN_ID");

// Create a campaign
const newCampaign = await client.campaigns.create({
  name: "Summer Sale",
  template: "TEMPLATE_ID",
  contactsTags: [{ slug: "newsletter" }],
  type: "instant-campaign",
});

// Trigger an instant campaign
await client.campaigns.send("CAMPAIGN_ID");

// Lifecycle controls
await client.campaigns.pause("CAMPAIGN_ID");
await client.campaigns.resume("CAMPAIGN_ID");
await client.campaigns.cancel("CAMPAIGN_ID");

// Check progress
const progress = await client.campaigns.progress("CAMPAIGN_ID");
// { total: 100, current: 45, successCount: 43, failedCount: 2, status: "running" }

// Update / delete
await client.campaigns.update("CAMPAIGN_ID", { name: "New Name" });
await client.campaigns.delete("CAMPAIGN_ID");
```

### `client.templates`

```ts
// List templates
const { data } = await client.templates.list({ page: 1, limit: 20 });

// Create
const template = await client.templates.create({
  name: "Welcome Message",
  content: "Hi {{name}}, welcome to our service!",
});

// Get / update / delete
await client.templates.get("TEMPLATE_ID");
await client.templates.update("TEMPLATE_ID", { content: "Updated content" });
await client.templates.delete("TEMPLATE_ID");
```

### `client.contacts`

```ts
// Create a contact
await client.contacts.create({
  name: "John Doe",
  phoneNumber: "8801712345678",
  tags: ["TAG_ID"],
});

// Bulk create
await client.contacts.bulkCreate({
  contacts: [
    { name: "Alice", phoneNumber: "8801711111111" },
    { name: "Bob", phoneNumber: "8801722222222" },
  ],
});

// Get / update / delete by ID
await client.contacts.get("CONTACT_ID");
await client.contacts.update("CONTACT_ID", { name: "John Smith" });
await client.contacts.delete("CONTACT_ID");
```

### `client.tags`

```ts
await client.tags.list();
await client.tags.get("my-tag-slug");
await client.tags.create({ name: "VIP Customers", slug: "vip-customers" });
await client.tags.delete("TAG_ID");
```

### `client.media`

```ts
await client.media.list();
await client.media.get("MEDIA_ID");
await client.media.delete("MEDIA_ID");
```

### `client.me` — Self-Resolving Shortcuts

All `/me/*` endpoints automatically identify the user from the API key — no user ID needed:

```ts
await client.me.templates({ page: 1, limit: 10 });
await client.me.campaigns({ page: 1, limit: 10 });
await client.me.tags();
await client.me.media();
```

---

## Webhook Verification

WbSender signs every webhook request with `HMAC-SHA256`. Always verify the signature before processing.

The `x-wbsender-signature` header is in the format `sha256=<hex>`.

### Node.js / Express (synchronous)

```ts
import express from "express";
import { verifySignature } from "@wbsender/sdk";

const app = express();

app.post(
  "/webhooks/wbsender",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const valid = verifySignature(
      req.body.toString("utf-8"),
      req.headers["x-wbsender-signature"] as string,
      process.env.WEBHOOK_SECRET!,
    );

    if (!valid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = JSON.parse(req.body.toString("utf-8"));
    console.log("Event:", payload.event, payload.data);

    res.sendStatus(200);
  },
);
```

### Next.js App Router — Edge Runtime (asynchronous)

```ts
// app/api/webhooks/wbsender/route.ts
import { verifySignatureAsync } from "@wbsender/sdk";
import type { WebhookPayload } from "@wbsender/sdk";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.text();

  const valid = await verifySignatureAsync(
    body,
    req.headers.get("x-wbsender-signature") ?? "",
    process.env.WEBHOOK_SECRET!,
  );

  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(body) as WebhookPayload;

  switch (payload.event) {
    case "message.sent":
      // handle message sent
      break;
    case "campaign.completed":
      // handle campaign completed
      break;
    case "session.disconnected":
      // handle session disconnected
      break;
  }

  return new Response("OK");
}
```

### Next.js App Router — Node Runtime (synchronous)

```ts
// app/api/webhooks/wbsender/route.ts
import { verifySignature } from "@wbsender/sdk";

export async function POST(req: Request) {
  const body = await req.text();

  const valid = verifySignature(
    body,
    req.headers.get("x-wbsender-signature") ?? "",
    process.env.WEBHOOK_SECRET!,
  );

  if (!valid) return new Response("Unauthorized", { status: 401 });

  const payload = JSON.parse(body);
  // process payload...

  return new Response("OK");
}
```

---

## Webhook Events

| Event                  | Description                               |
| ---------------------- | ----------------------------------------- |
| `message.sent`         | A message was delivered successfully      |
| `message.failed`       | A message delivery failed                 |
| `campaign.started`     | A campaign began sending                  |
| `campaign.completed`   | All campaign messages have been processed |
| `campaign.failed`      | Campaign encountered a fatal error        |
| `session.connected`    | A WhatsApp session came online            |
| `session.disconnected` | A WhatsApp session went offline           |

---

## Error Handling

All API errors throw a `WbsenderError`:

```ts
import { WbsenderClient, WbsenderError } from "@wbsender/sdk";

try {
  await client.messages.send({ to: "...", message: "Hi" });
} catch (err) {
  if (err instanceof WbsenderError) {
    console.error(`API error ${err.status}: ${err.message}`);
  }
  throw err;
}
```

| Property  | Type     | Description                |
| --------- | -------- | -------------------------- |
| `status`  | `number` | HTTP status code           |
| `message` | `string` | Error message from the API |

---

## TypeScript

All request/response shapes are fully typed. Import types directly:

```ts
import type {
  Campaign,
  Template,
  Contact,
  Tag,
  MediaFile,
  WebhookEvent,
  WebhookPayload,
  SendMessageOptions,
  CreateCampaignOptions,
} from "@wbsender/sdk";
```

---

## License

MIT © WbSender
