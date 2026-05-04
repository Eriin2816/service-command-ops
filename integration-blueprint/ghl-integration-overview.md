# GHL Integration Overview

## Inbound (GHL → ServiceOps)
- GHL sends webhook when appointment is booked or opportunity moves to job-ready stage
- ServiceOps receives payload, verifies signature, creates work order

## Outbound (ServiceOps → GHL)
- Job completed → update GHL opportunity status via API
- Estimate needed → create GHL opportunity task or update stage
- Review request → trigger GHL workflow via API

## API Authentication
- Private Integration Token (simpler) OR OAuth 2.0 (for marketplace app)
- Decision to be confirmed with client
- Never hardcode token — always use environment variables

## GHL API Docs Reference
- https://highlevel.stoplight.io/docs/integrations/
