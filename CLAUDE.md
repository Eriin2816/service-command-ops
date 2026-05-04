# ServiceOps Command Center — Claude Code Instructions

## 1. Project Mission
ServiceOps Command Center is a GHL-integrated work order and field operations SaaS built first for Showtime Pool Service (California), designed to scale into a white-label Jobber-style product for local service businesses already using GoHighLevel.

## 2. What We Are Building
- Work order management system
- Field job and visit tracking
- Technician mobile job view
- Job checklists (pool service templates)
- Before/after photo uploads and technician notes
- Property profiles with equipment records
- Recurring service visit scheduling
- Job completion reports
- Estimate-needed handoff back to GHL
- Owner/admin operations dashboard
- Multi-tenant SaaS architecture (future)

## 3. What We Are NOT Building
- A CRM (GHL handles CRM)
- A conversations/messaging tool (GHL handles this)
- A lead capture or form system (GHL handles this)
- An SMS/email automation system (GHL handles this)
- A sales pipeline or opportunity management tool (GHL handles this, we only mirror status)
- A booking/calendar system (GHL handles this)
- A marketing automation tool (GHL handles this)
- A native mobile app (Phase 1 is mobile-responsive web)
- A full invoicing or payment system (future scope)
- A route optimization engine (future scope)
- A customer-facing portal (future scope)
- Inventory management (future scope)

## 4. GHL Source-of-Truth Rules
- GHL is the source of truth for: contacts, conversations, lead pipeline/opportunity status, calendars, forms, SMS/email, marketing workflows
- ServiceOps is the source of truth for: work orders, properties, visits, technician notes, checklists, job photos, completion reports, recurring service schedules, estimate handoffs
- Never duplicate GHL contacts — reference by GHL contact ID only
- Never invent or hardcode GHL API keys or credentials
- Never trigger customer-facing messages without review
- Sync only the minimum data needed

## 5. Core MVP Modules
1. Dashboard shell + navigation
2. Work Orders (create, assign, status lifecycle)
3. Property Profiles (address, equipment, access notes, service history)
4. Technician Mobile View (today's jobs, checklist, photos, notes)
5. Job Checklists (pool service templates)
6. GHL Webhook Intake (placeholder → functional)
7. Estimate-Needed Handoff (flag → GHL opportunity update)
8. Basic Owner Reporting Dashboard

## 6. Future Modules (Do Not Build Yet)
- Multi-tenant SaaS architecture
- White-label tenant billing
- Route optimization
- Customer portal
- Invoicing and payments
- AI knowledge base assistant
- Native mobile apps
- Inventory management
- Dispatch board
- AI voice

## 7. User Roles
| Role | Access |
|------|--------|
| Platform Owner | All tenants, billing, settings |
| Tenant Admin | Full access to their tenant |
| Office Staff | Dashboard, work orders, scheduling |
| Technician | Mobile job view, own jobs only |
| Read-only Owner | Dashboard and reports only |

## 8. Build Order
0. Scaffold (done)
1. MVP UI Shell + Navigation
2. Work Order Module
3. Property Profile Module
4. Technician Mobile View
5. GHL Webhook Intake
6. Status Sync Back to GHL
7. Reporting Dashboard
8. QA and Launch
9. Multi-Tenant SaaS Hardening

## 9. Coding Standards
- TypeScript strict mode — always
- Next.js App Router — always
- Tailwind CSS — always
- shadcn/ui-compatible component structure
- No `any` types — use proper TypeScript types from `src/types/`
- No hardcoded strings — use constants from `src/config/`
- All API routes in `src/app/api/`
- All types in `src/types/`
- All utility functions in `src/lib/utils/`
- Zod validation on all API inputs
- Async/await — no raw Promises
- Error handling on all API calls

## 10. UI Standards
- Mobile-first responsive design
- Tailwind CSS only (no custom CSS unless absolutely necessary)
- shadcn/ui components where available
- Consistent layout using components in `src/components/layout/`
- Technician view must be optimized for one-handed phone use
- Admin dashboard must work on tablet and desktop

## 11. Data Modeling Rules
- All schemas documented in `database-blueprint/` before implementation
- Use UUIDs for all IDs
- All tables have `created_at`, `updated_at`, `tenant_id`
- Status fields use enums defined in `src/types/`
- GHL references stored as `ghl_contact_id`, `ghl_opportunity_id` — never store full GHL objects in DB
- Design for multi-tenant from day one — `tenant_id` on every record

## 12. Security Rules
- Never hardcode API keys, secrets, or tokens
- All secrets in `.env` — never in code
- All `.env` values validated at startup via `validate-env.sh`
- GHL webhook signatures must be verified
- Auth required on all non-public routes
- Role-based access control enforced at API route level
- Tenant isolation enforced at every database query
- PII (customer names, addresses, phones) handled with care

## 13. Testing Rules
- Manual test plan in `qa/manual-test-plan.md` before each phase
- QA checklist in `qa/mvp-qa-checklist.md` before launch
- Test GHL webhook payloads with mock data
- Test all role permission scenarios
- Test technician view on actual mobile device

## 14. Agent Usage Rules
- product-orchestrator: scope decisions, MVP priority, preventing overbuilding
- solutions-architect: architecture, module boundaries, data flow
- ghl-integration-architect: all GHL API/webhook questions
- field-operations-designer: work order, visit, checklist, technician workflow
- ux-dashboard-designer: UI layout, navigation, mobile view
- data-modeling-agent: schema design, relationships, enums
- qa-review-agent: requirements review, edge cases, launch readiness

## 15. Skill Usage Rules
- project-planning: use when planning new modules or phases
- ghl-integration: use when designing/implementing GHL-related features
- work-order-design: use for work order, visit, checklist, completion logic
- dashboard-ui: use for any dashboard or mobile UI work
- data-modeling: use for schema and database design
- qa-review: use before marking any feature complete
- documentation: use when updating docs or writing specs

## 16. Documentation Rules
- Update MEMORY.md and memory/ files after major decisions
- All new modules need a spec in specs/ before building
- All schema changes documented in database-blueprint/
- All GHL integration changes documented in integration-blueprint/
- README.md must stay accurate
- Non-technical explanations in docs/ must be understandable by the client

## 17. Critical Warnings
⛔ Do NOT rebuild GHL CRM features
⛔ Do NOT invent or hardcode GHL API credentials
⛔ Do NOT make architecture changes without documenting them first
⛔ Do NOT skip tenant_id on any database record
⛔ Do NOT create customer-facing messages without client review
⛔ Do NOT overbuild — ask before adding scope
⛔ Plan before coding. Ask when unsure. Keep MVP simple.
