---
description: Use when designing or implementing GoHighLevel API, webhooks, contacts, opportunities, calendars, tags, custom fields, workflows, or sync logic.
---

# Skill: GHL Integration

## When to Use
- Designing GHL webhook intake
- Designing outbound GHL API calls
- Mapping GHL fields to ServiceOps
- Reviewing GHL auth approach
- Testing GHL integration

## Steps Claude Should Follow

1. **Read integration context**
   - Read integration-blueprint/ghl-integration-overview.md
   - Read integration-blueprint/ghl-source-of-truth-rules.md
   - Read .claude/rules/ghl-source-of-truth.md

2. **Identify integration type**
   - Inbound (GHL webhook → ServiceOps)?
   - Outbound (ServiceOps → GHL API)?
   - Field mapping?

3. **Design integration**
   - Define payload structure
   - Define verification steps
   - Define error handling
   - Define retry logic

4. **Document in integration-blueprint/**
   - Update relevant integration doc
   - Document GHL field mappings

5. **Implement safely**
   - Use env variables for all credentials
   - Verify signatures on webhooks
   - Handle API errors gracefully

## Output Checklist
- [ ] Webhook signature verification included
- [ ] No hardcoded credentials
- [ ] Error handling defined
- [ ] Integration doc updated
- [ ] GHL contact not duplicated in ServiceOps DB

## Mistakes to Avoid
- Hardcoding GHL API tokens
- Skipping webhook signature verification
- Storing full GHL contact records in ServiceOps DB
- Polling GHL API instead of using webhooks
- Blocking job completion if GHL API call fails
