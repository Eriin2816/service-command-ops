# GHL Rules — Non-Negotiable

1. GHL is source of truth for contacts — never store full contact records in ServiceOps DB
2. Reference GHL data by ID only (ghl_contact_id, ghl_opportunity_id)
3. Never rebuild GHL SMS/email/conversations
4. Never rebuild GHL pipeline/opportunity management
5. Never rebuild GHL calendar/booking
6. Verify all GHL webhook signatures
7. Never hardcode GHL API tokens
8. Handle GHL API rate limits with backoff and queuing
9. Test with sandbox/sub-account before connecting to client's live GHL
