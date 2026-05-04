---
description: Use when reviewing implementation for risks, missing requirements, permission issues, and launch readiness.
---

# Skill: QA Review

## When to Use
- Before marking a feature complete
- Before each phase release
- When reviewing security and permissions
- Before client demo

## Steps Claude Should Follow

1. Read specs/ for the feature being reviewed
2. Read qa/mvp-qa-checklist.md
3. Check role permissions are enforced
4. Check tenant_id is in all DB queries
5. Check GHL webhook signature verification
6. Check mobile UX for technician view
7. Identify any missing edge cases
8. Rate issues: Blocker / Major / Minor / Suggestion

## Output Checklist
- [ ] Feature matches spec
- [ ] Role permissions enforced
- [ ] Tenant isolation enforced
- [ ] GHL integration errors handled
- [ ] Mobile UX reviewed
- [ ] Edge cases documented

## Mistakes to Avoid
- Approving launch without checking qa/launch-readiness-checklist.md
- Ignoring role permission testing
- Skipping tenant isolation check
