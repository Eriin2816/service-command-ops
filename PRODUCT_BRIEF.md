# Product Brief — ServiceOps Command Center

## Product Name
ServiceOps Command Center

## Internal Use Case (Phase 0–1)
Showtime Pool Service — a California pool service company currently using GoHighLevel for CRM, marketing, and customer communication.

## Future SaaS Use Case
A white-label Jobber-style work order and field operations add-on for local service businesses (pool service, landscaping, HVAC, plumbing, pest control) already using GoHighLevel.

## The Problem
GHL is excellent for marketing, lead capture, CRM, and customer communication. But it has no native work order management, field technician workflow, property profile system, or structured job completion reporting. Service businesses using GHL have an operations gap once a lead converts to a customer who needs scheduled field service.

## The Solution
ServiceOps Command Center fills the operations gap. It plugs into GHL via webhooks and API, receives job-ready data, creates work orders, routes jobs to technicians, and sends status updates back to GHL when follow-up is needed.

## Users
| User | Role |
|------|------|
| Platform Owner | Manages the SaaS platform across all tenants |
| Tenant Admin | Showtime Pool Service owner — full operations access |
| Office Staff | Schedules jobs, manages work orders |
| Technician | Field worker — mobile job view, checklists, photos |
| Read-only Owner | Investor or owner — reports and dashboard only |

## MVP Features
- Dashboard shell with navigation
- Work order creation and management
- Property profiles with equipment records
- Technician mobile job view
- Pool service job checklists
- Photo uploads and technician notes
- GHL webhook intake (receive job-ready data)
- Estimate-needed handoff back to GHL
- Basic owner reporting dashboard

## Non-Goals (v1)
- Full CRM (GHL handles this)
- Full invoicing/payments
- Route optimization
- Customer-facing portal
- Native mobile app
- AI voice
- Inventory management
- White-label tenant billing
- Complex dispatch board

## Success Criteria (MVP)
- Showtime Pool Service owner can see all active work orders at a glance
- Technicians can view today's jobs and complete checklists on mobile
- A completed job triggers a status update back to GHL
- An "Estimate Needed" flag from a technician creates a follow-up task in GHL
- Property profiles capture equipment history per customer address
- Recurring weekly pool service visits are trackable
