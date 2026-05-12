# Launch Readiness Checklist
_Last updated: 2026-05-14 — Phase 16 + Showtime pre-launch sections added_

## Code
- [x] TypeScript strict — no errors (`tsc --noEmit` exits clean)
- [x] No hardcoded API keys (all secrets via `process.env`)
- [x] All env vars in `.env.example` (Supabase keys, NEXTAUTH_*, GHL_*, storage)
- [x] `.env` not committed to git (`.env.local` in `.gitignore`)

## Auth & Security
- [x] All `/dashboard/*` routes require auth (`withAuth` middleware guards `/dashboard/:path*`)
- [x] All `/tech/*` routes require auth (`withAuth` middleware guards `/tech/:path*`)
- [x] Technician role blocked from `/dashboard/*` (middleware redirects → `/tech/today`)
- [x] `tenant_id` on all API-layer DB calls (`getTenantId()` throws on missing session)
- [x] GHL webhook signature verified (HMAC-SHA256; in production, missing secret returns 503)
- [x] No hardcoded credentials in source (bcrypt+DB auth; `DEMO_USERS` removed)
- [x] Reports page reads `tenant_id` from session (fixed Phase 10 — was hardcoded `"tenant-showtime"`)
- [ ] All `.env` values confirmed set in Vercel dashboard
- [ ] NEXTAUTH_SECRET confirmed as a strong random value (not default)
- [ ] Supabase RLS enabled and tested with two tenants
- [ ] No secrets in source code (run: `grep -r "sk_" --include="*.ts" src/`)

## GHL Integration
- [x] Error handling in place (`ghlFetch` retries, never-throw pattern, webhook always 200)
- [x] Webhook returns 401 for invalid signature; 503 if secret not configured in production
- [ ] Webhook endpoint configured in GHL settings (requires GHL dashboard action — see below)
- [ ] Real GHL credentials from client confirmed and set in Vercel
- [ ] Pipeline stage names confirmed with client and coded in `GHL_OPPORTUNITY_STATUS_TRIGGERS`
- [ ] Webhook tested with real GHL payload (not just mock data)
- [ ] Completion sync tested end-to-end (tech marks complete → GHL opportunity updates)
- [ ] Estimate handoff tested end-to-end (flag → GHL task created → status reflects back)
- [ ] GHL webhook signature verification tested with live signing secret

## Data
- [x] GHL webhook pipeline wired to Supabase DB (all 3 handlers use real DB queries)
- [x] Work order creation saves to DB (confirmed working)
- [x] `estimate_handoffs` table written to when estimate is flagged (fixed Phase 10)
- [x] GHL task ID written back to `estimate_handoffs` record on successful GHL sync
- [x] Visits link to work orders (FK in schema; `getOrCreateVisit` persists to DB)
- [ ] Seed data removed or clearly marked as test data (not real customer records)
- [ ] Client's real properties imported or ready to add manually
- [ ] Technician accounts created with real credentials (real names, real email addresses)
- [ ] Admin account email changed from `@showtime.local` to client's real email
- [ ] Property records tested end-to-end (UI create → DB → list)

## UI / Performance
- [x] Work Orders table fetches from real DB via API (loading skeleton + error + retry)
- [x] Properties table fetches from real DB via API (loading skeleton + error + retry)
- [x] Overview/Reports dashboard reads tenant from session (not hardcoded)
- [x] Technician today page fetches from DB (server component, filtered by tech + date)
- [x] Technician job detail fetches from DB (`getOrCreateVisit` persists checklist)
- [x] New work order appears in list after creation (live refresh via `forwardRef` + retry)
- [ ] Dashboard overview loads under 2 seconds
- [ ] Work orders list loads under 2 seconds
- [ ] Technician mobile view loads under 1.5 seconds
- [ ] Images lazy-loaded on work order detail

## Mobile
- [ ] Tested on real iPhone (Safari)
- [ ] Tested on real Android (Chrome)
- [ ] All buttons meet 44px minimum tap target
- [ ] No horizontal scroll on mobile
- [ ] Checklist completion works gracefully on slow 4G
- [ ] Technician view tested on real phone — manual test required
- [ ] Dashboard tested on tablet — manual test required
- [ ] No broken layouts — manual browser sweep required

## Pending Manual / External Actions
- [ ] **NEXTAUTH_URL** — must be `https://serviceops-ghl-workorders.vercel.app` in Vercel env vars
- [ ] **GHL webhooks** — configure in GHL → Settings → Integrations → Webhooks:
  - URL: `https://serviceops-ghl-workorders.vercel.app/api/ghl/webhooks`
  - Events: `OpportunityStatusChange`, `AppointmentBooked`, `ContactCreate`, `ContactUpdate`
  - Secret: value of `GHL_WEBHOOK_SECRET` from Vercel env
- [ ] **CRON_SECRET** — set in Vercel for recurring schedule cron (Monday 6 AM UTC auto-registered)
- [ ] **Persistent retry queue** — replace in-memory queue with Supabase `ghl_sync_queue` table or Upstash QStash before production (schema in `integration-blueprint/ghl-api-error-handling.md`)

## Client Sign-off
- [ ] Client demo walkthrough completed
- [ ] Client has reviewed technician mobile flow on real phone
- [ ] Client has confirmed GHL pipeline stage names match `GHL_OPPORTUNITY_STATUS_TRIGGERS`
- [ ] Client has confirmed GHL custom field IDs for pool-specific fields (gate codes, service notes)
