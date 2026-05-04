# Inbound Webhooks from GHL

## Endpoint
POST /api/ghl/webhooks

## Verification
- GHL signs webhook payloads with HMAC-SHA256
- Verify using GHL_WEBHOOK_SECRET env variable
- Return 401 if signature invalid
- Return 200 quickly, process async

## Expected Webhook Events
| Event | Action |
|-------|--------|
| OpportunityStatusChange | Create or update work order |
| AppointmentBooked | Create work order from appointment |
| ContactTagApplied | TBD — configure with client |

## Payload Mapping
See ghl-contact-mapping.md and ghl-opportunity-mapping.md

## Error Handling
- Log all incoming webhooks
- Return 200 even if processing fails (to prevent GHL retry storm)
- Queue failed processing for retry
- Alert on repeated failures
