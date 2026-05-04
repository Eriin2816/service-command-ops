# Build Rules

1. Plan first, code second — create specs before features
2. No production logic without a schema doc
3. No GHL integration code without an integration doc
4. No hardcoded credentials, keys, or secrets
5. tenant_id on every database record — always
6. GHL contact ID is a reference, not a duplicate
7. Mobile-first for technician view — test on real phone
8. TypeScript strict mode — no `any`
9. All API routes require auth check
10. All status values come from enums, not strings
11. Update memory/ files after decisions
12. Ask before expanding scope
13. Never invent GHL API behavior — read GHL docs
14. Never create customer-facing messages without client review
