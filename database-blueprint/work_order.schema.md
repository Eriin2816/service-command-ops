# Work Order Schema

## Table: work_orders

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | FK → tenants.id |
| property_id | UUID | FK → properties.id |
| ghl_contact_id | VARCHAR | GHL reference only |
| ghl_opportunity_id | VARCHAR | GHL reference only |
| title | VARCHAR | Short job description |
| description | TEXT | Full job description |
| status | ENUM | WorkOrderStatus |
| priority | ENUM | Priority |
| service_category | ENUM | ServiceCategory |
| assigned_technician_id | UUID | FK → users.id |
| scheduled_date | DATE | |
| scheduled_time_start | TIME | |
| scheduled_time_end | TIME | |
| completed_at | TIMESTAMPTZ | |
| estimate_handoff_status | ENUM | EstimateHandoffStatus |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |
