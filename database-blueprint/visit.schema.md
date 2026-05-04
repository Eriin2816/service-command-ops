# Visit Schema

## Table: visits

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | FK → tenants.id |
| work_order_id | UUID | FK → work_orders.id |
| property_id | UUID | FK → properties.id |
| technician_id | UUID | FK → users.id, nullable |
| status | ENUM | VisitStatus |
| scheduled_date | DATE | |
| completed_at | TIMESTAMPTZ | |
| estimate_flagged | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |
