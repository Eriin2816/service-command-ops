# Launch Readiness Checklist

## Code
- [x] TypeScript strict — no errors (`tsc --noEmit` exits clean)
- [x] No hardcoded API keys (all secrets via `process.env`)
- [x] All env vars in .env.example (ADMIN_PASSWORD, TECH_PASSWORD, GHL_WEBHOOK_SECRET, Supabase keys, NEXTAUTH_*)
- [x] .env not committed to git (.env.local in .gitignore)

## Auth & Security
- [x] All dashboard routes require auth (middleware guards /dashboard/* and /tech/*)
- [x] Technician can only see own jobs (`isTechnicianScoped` check in visits + work-orders routes)
- [x] tenant_id on all DB queries (enforced in all three query files)
- [x] GHL webhook signature verified (HMAC-SHA256 + timingSafeEqual in /api/ghl/webhooks)

## GHL Integration
- [ ] Webhook endpoint tested with real GHL payload (requires live GHL credentials)
- [ ] Outbound GHL API calls tested (requires live GHL token)
- [x] Error handling in place (ghlFetch retries + never-throw pattern; webhook always returns 200)

## Data
- [x] GHL webhook pipeline wired to Supabase DB (create-work-order-from-ghl.ts uses DB queries)
- [ ] Property records created correctly (DB not connected — placeholder Supabase credentials)
- [ ] Work orders link to properties (schema: FK in migration; runtime: awaiting DB connection)
- [ ] Visits link to work orders (schema: FK in migration; runtime: awaiting DB connection)

## UI
- [x] Dashboard work orders table fetches from API (loading skeleton + error state)
- [x] Dashboard properties table fetches from API (loading skeleton + error state)
- [x] Overview dashboard fetches from API (tenant derived from session, not hardcoded)
- [x] Technician today page fetches from DB (server component, filters by tech + date)
- [x] Technician job detail page fetches from DB (server component, getOrCreateVisit via DB)
- [ ] Technician view tested on real phone
- [ ] Dashboard tested on tablet
- [ ] No broken layouts

## Client
- [ ] Client demo walkthrough completed
- [ ] Client has reviewed technician flow
- [ ] Client has confirmed GHL pipeline stage names
