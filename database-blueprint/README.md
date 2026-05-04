# Database Blueprint

All schema decisions are documented here before implementation.
Do not create any database tables without a schema doc in this folder.

## Entities
See entities.md for the full list of entities and their purposes.

## Design Principles
- All tables have: id (UUID), tenant_id, created_at, updated_at
- GHL data referenced by ID only — no duplicate GHL records
- Soft-delete where needed (is_active or deleted_at)
- Enums defined in src/types/ and mirrored in DB
- Design for multi-tenant from day one
