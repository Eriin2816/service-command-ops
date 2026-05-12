# GHL API Error Handling

## Outbound Sync Strategy

All outbound GHL API calls follow a fire-and-forget pattern:

1. The HTTP response is returned to the client immediately.
2. The sync runs asynchronously via `waitUntil()` (Vercel serverless) or as a floating Promise (fallback).
3. On failure, the work order is flagged `ghl_sync_failed = true` in the DB.
4. The failed item is enqueued in the in-memory retry queue.
5. The dashboard surfaces the flag as an amber warning banner with a "Retry Sync" button on the work order detail page, and an amber dot indicator on the work orders list.

## Retry Queue — Current Limitation

**Current retry queue is in-memory (`src/lib/ghl/retry-queue.ts`).**

This implementation does **not** survive:
- Server restarts
- Serverless cold starts (each invocation is a fresh process)
- Vercel function scale-out (each instance has its own memory)

Items are visible in Vercel runtime logs but are lost as soon as the function instance recycles.

## Before Production: Replace with Persistent Queue

Option A — Supabase DB table (recommended for this stack):

```sql
create table ghl_sync_queue (
  id                uuid primary key default gen_random_uuid(),
  work_order_id     uuid not null references work_orders(id) on delete cascade,
  tenant_id         uuid not null,
  type              text not null,       -- 'opportunity_won', 'task_create', etc.
  payload           jsonb not null,
  attempts          int not null default 0,
  last_attempted_at timestamptz,
  created_at        timestamptz not null default now()
);
```

A scheduled background job (Vercel Cron or Next.js route handler) polls this table, retries with exponential backoff, and deletes rows on success.

Option B — External queue:
- **Upstash QStash** — HTTP-based, serverless-native, built-in retries and delays.
- **Redis (Upstash)** — list-based queue with a worker polling on schedule.
- **Inngest** — event-driven background jobs, first-class Next.js support.

## Rate Limiting

GHL API enforces rate limits. The outbound client (`src/lib/ghl/client.ts`) should:
- Implement exponential backoff on 429 responses.
- Respect `Retry-After` headers when present.
- Cap retries at 3–5 attempts before flagging `ghl_sync_failed`.

## waitUntil Pattern

The PATCH route wraps sync calls using:

```ts
const syncPromise = syncCompletionToGhl(updatedWo).catch(console.error);
if (typeof (globalThis as Record<string, unknown>).waitUntil === "function") {
  (globalThis as { waitUntil: (p: Promise<unknown>) => void }).waitUntil(syncPromise);
}
// syncPromise floats as fire-and-forget fallback in Node.js runtime
```

`waitUntil` is available in:
- Vercel Edge Runtime — natively via `waitUntil()`
- Next.js 15 Node.js runtime — use `import { after } from "next/server"` as an alternative
- Bare Node.js — not available; the floating Promise handles this

**Open item:** Evaluate switching to `after()` from `next/server` (available in Next.js 15) which is the idiomatic Next.js way to run post-response work without `waitUntil`.
