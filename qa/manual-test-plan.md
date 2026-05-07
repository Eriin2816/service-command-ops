# Manual Test Plan

## Instructions
Complete this plan before each phase release.
Check off each item manually or via automated test.

## Phase 1: Dashboard Shell
- [x] Navigation renders on desktop
- [x] Navigation renders on mobile (MobileNav drawer)
- [x] All placeholder pages load without error
- [x] No TypeScript errors (`tsc --noEmit` exits clean)
- [ ] No console errors in browser (verify after connecting Supabase)

## Dashboard Pages — Load Without Error
- [ ] /dashboard/overview loads (shows stats or empty state, never red error)
- [ ] /dashboard/work-orders loads (shows table or empty state, never red error)
- [ ] /dashboard/properties loads (shows table or empty state, never red error)
- [ ] /dashboard/technicians loads (shows placeholder UI)
- [ ] /dashboard/visits loads (shows placeholder UI)
- [ ] /dashboard/estimates loads (shows placeholder UI)
- [ ] /dashboard/reports loads (shows charts or empty state)
- [ ] Error state on Overview has "Try again" button that retries the fetch
- [ ] Error state on Work Orders has "Try again" button that retries the fetch
- [ ] Error state on Properties has "Try again" button that retries the fetch
- [ ] API routes return 200 with empty data on DB failure (not 500)
  - Verify: GET /api/reports/summary → { data: { total_work_orders: 0, ... } }
  - Verify: GET /api/work-orders → { data: [], total: 0 }
  - Verify: GET /api/properties → { data: [], total: 0 }

## Phase 2: Work Orders
- [ ] Create work order successfully (requires Supabase credentials)
- [ ] Status changes work correctly (requires Supabase credentials)
- [ ] Assign technician works (requires Supabase credentials)
- [ ] Work order links to property (requires Supabase credentials)
- [x] Validation rejects invalid input (Zod validation on all API routes)

## Phase 4: Technician Mobile
- [ ] Today's jobs load on iPhone (requires Supabase credentials + real data)
- [ ] Today's jobs load on Android (requires Supabase credentials + real data)
- [ ] Checklist items can be checked (requires Supabase credentials)
- [ ] Notes can be entered (requires Supabase credentials)
- [ ] Complete button works (requires Supabase credentials)
- [ ] Estimate flag button works (requires Supabase credentials)

## Phase 5: GHL Webhooks
- [x] Webhook endpoint accepts POST (/api/ghl/webhooks route exists)
- [x] Invalid signature returns 401 (verifySignature implemented)
- [ ] Valid payload creates work order (requires live GHL + Supabase credentials)
- [ ] Duplicate payload is idempotent (requires live GHL + Supabase credentials)

## Blocking on Supabase credentials
The following items cannot be tested until `.env.local` is updated with real Supabase values
and migrations are run against a live project:
- Work order CRUD via dashboard UI
- Property CRUD via dashboard UI
- Technician mobile job flow
- GHL webhook → DB work order creation
- Reports dashboard data
