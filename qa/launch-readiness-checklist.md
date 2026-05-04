# Launch Readiness Checklist

## Code
- [ ] TypeScript strict — no errors
- [ ] No hardcoded API keys
- [ ] All env vars in .env.example
- [ ] .env not committed to git

## Auth & Security
- [ ] All dashboard routes require auth
- [ ] Technician can only see own jobs
- [ ] tenant_id on all DB queries
- [ ] GHL webhook signature verified

## GHL Integration
- [ ] Webhook endpoint tested with real GHL payload
- [ ] Outbound GHL API calls tested
- [ ] Error handling in place

## UX
- [ ] Technician view tested on real phone
- [ ] Dashboard tested on tablet
- [ ] No broken layouts

## Data
- [ ] Property records created correctly
- [ ] Work orders link to properties
- [ ] Visits link to work orders

## Client
- [ ] Client demo walkthrough completed
- [ ] Client has reviewed technician flow
- [ ] Client has confirmed GHL pipeline stage names
