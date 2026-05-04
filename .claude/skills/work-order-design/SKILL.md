---
description: Use when designing work orders, visits, job statuses, checklists, technician notes, and completion reports.
---

# Skill: Work Order Design

## When to Use
- Designing work order lifecycle
- Building work order forms or views
- Designing visit and checklist flows
- Planning job completion logic

## Steps Claude Should Follow

1. Read workflow-blueprint/workflow-ghl-to-work-order.md
2. Read workflow-blueprint/workflow-job-completion.md
3. Read database-blueprint/work_order.schema.md
4. Read specs/feature-work-orders.md

5. Design with the full lifecycle in mind:
   NEW → ASSIGNED → IN_PROGRESS → COMPLETED / ESTIMATE_NEEDED / NEEDS_FOLLOW_UP / CANCELLED

6. Confirm field requirements match TypeScript types in src/types/work-order.ts

## Output Checklist
- [ ] Status lifecycle documented
- [ ] Required fields defined
- [ ] Enum values match src/types/
- [ ] Estimate handoff path included
- [ ] tenant_id on all records

## Mistakes to Avoid
- Status as raw strings instead of enums
- Missing estimate-needed workflow
- Forgetting tenant_id
- Over-complicating the technician completion flow
