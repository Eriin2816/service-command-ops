# Workflow: GHL → Work Order

## Trigger
GHL sends webhook when opportunity status changes to job-ready (e.g., "Booked", "Won", "Service Needed")

## Steps
1. GHL webhook fires → POST /api/ghl/webhooks
2. Verify webhook signature
3. Parse payload (contact ID, opportunity ID, calendar event)
4. Look up or create property record using contact address
5. Create work order linked to property + GHL IDs
6. Set status: NEW
7. Notify admin (in-app, future: SMS/email via GHL)
8. Admin assigns technician and schedules date

## Edge Cases
- Contact has no address → flag for manual data entry
- Duplicate webhook for same opportunity → idempotency check
- GHL contact not found → log error, skip
