# Roadmap — ServiceOps Command Center

## Phase 0: Scaffold ✅
- Complete folder structure
- Documentation system
- Claude Code agents, skills, rules
- TypeScript type placeholders
- Config placeholders
- Memory files
- Blueprint docs

## Phase 1: MVP UI Shell
- Next.js app structure with App Router
- Dashboard layout (sidebar + header)
- Navigation for all dashboard sections
- Placeholder pages for each module
- Mobile-responsive technician layout shell
- shadcn/ui component integration
- Tailwind theme configuration

## Phase 2: Work Order Module
- Work order creation form
- Work order list view with filters
- Work order detail page
- Status lifecycle (New → Assigned → In Progress → Completed / Needs Follow-up)
- Assign technician to work order
- Priority and service category
- Link to property profile

## Phase 3: Property Profile Module
- Property record (address, customer name, GHL contact ID)
- Pool equipment records (pump, filter, heater, sanitizer system)
- Access notes
- Service history per property
- Link work orders to property

## Phase 4: Technician Mobile View
- Today's job list (mobile-optimized)
- Job detail view
- Checklist completion (tap-to-check)
- Photo upload (camera/gallery)
- Technician notes
- Mark job complete or flag estimate needed

## Phase 5: GHL Webhook Intake
- Webhook endpoint at `/api/ghl/webhooks`
- Webhook signature verification
- Parse GHL contact + opportunity + calendar event data
- Create work order from GHL webhook
- Map GHL fields to ServiceOps data model

## Phase 6: Status Sync Back to GHL
- When job is completed → update GHL opportunity/contact via API
- When estimate needed → flag GHL opportunity, create task
- When review request triggered → trigger GHL automation
- Error handling and retry logic for GHL API calls

## Phase 7: Reporting Dashboard
- Owner KPI cards (jobs today, completed this week, open estimates)
- Work order status breakdown chart
- Technician productivity summary
- Service category breakdown
- Overdue jobs alert list

## Phase 8: QA and Launch
- Complete manual test plan
- Role permission testing
- Mobile device testing
- GHL webhook integration testing with real payloads
- Performance review
- Security audit
- Launch checklist sign-off

## Phase 9: Multi-Tenant SaaS Hardening
- Tenant isolation enforcement
- Onboarding flow for new tenants
- GHL app marketplace listing prep
- White-label theming
- Tenant billing integration (Stripe)
- Platform admin dashboard
- Usage monitoring and limits
