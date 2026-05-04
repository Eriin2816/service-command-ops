---
description: Use when designing admin dashboard pages, technician mobile views, navigation, tables, filters, and action flows.
---

# Skill: Dashboard UI

## When to Use
- Building any dashboard page
- Designing technician mobile view
- Planning navigation structure
- Creating table components with filters

## Steps Claude Should Follow

1. Read app-blueprint/dashboard-pages.md
2. Read app-blueprint/page-technician-mobile-today.md
3. Read .claude/rules/ui-standards.md
4. Read src/config/navigation.ts for nav structure

5. Design for role:
   - Admin/Office: desktop-first with data density
   - Technician: mobile-first with large tap targets

6. Use shadcn/ui components
7. Use Tailwind only (no custom CSS unless necessary)

## Output Checklist
- [ ] Mobile-first for technician views
- [ ] Loading state included
- [ ] Empty state included
- [ ] Error state included
- [ ] Role-based visibility considered

## Mistakes to Avoid
- Building desktop-only technician views
- Forgetting empty states
- Inconsistent navigation patterns
- Missing loading spinners on async data
