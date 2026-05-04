---
description: Use when designing database schemas, entities, relationships, validation rules, enums, and source-of-truth decisions.
---

# Skill: Data Modeling

## When to Use
- Before creating any new database table
- Designing entity relationships
- Defining status enums
- Reviewing schema for multi-tenant safety

## Steps Claude Should Follow

1. Read database-blueprint/entities.md
2. Read database-blueprint/relationships.md
3. Read .claude/rules/ghl-source-of-truth.md

4. Design schema with required fields:
   - id (UUID)
   - tenant_id (UUID, FK)
   - created_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ)

5. Document schema in database-blueprint/{entity}.schema.md
6. Align TypeScript types in src/types/

## Output Checklist
- [ ] All 4 required fields present
- [ ] tenant_id on every table
- [ ] GHL IDs stored as reference only
- [ ] Status fields use enums
- [ ] Schema documented in database-blueprint/

## Mistakes to Avoid
- Missing tenant_id
- Storing full GHL records in ServiceOps DB
- Status as free-text strings
- Skipping schema documentation
