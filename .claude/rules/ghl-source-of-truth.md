# GHL Source of Truth Rules

## GHL Owns
- Contact records (names, emails, phones, addresses)
- Conversation history (SMS, email, chat)
- Lead pipeline stages and opportunities
- Calendar events and appointments
- Forms and survey responses
- Tags and custom field values (on contacts)
- Marketing workflows and automations

## ServiceOps Owns
- Work orders
- Property profiles
- Equipment records
- Visit records
- Checklists and checklist completion
- Technician notes
- Job photos
- Completion reports
- Estimate handoff records
- Recurring service schedules

## Integration Rules
- Store GHL contact ID, not full contact data
- Store GHL opportunity ID, not full opportunity data
- Sync only what is necessary
- Verify webhook signatures before processing
- Handle GHL API errors gracefully — never block job completion
