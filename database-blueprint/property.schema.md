# Property Schema

## Table: properties

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | FK → tenants.id |
| ghl_contact_id | VARCHAR | GHL contact reference |
| customer_name | VARCHAR | Display name |
| address_line1 | VARCHAR | |
| address_line2 | VARCHAR | Nullable |
| city | VARCHAR | |
| state | VARCHAR | |
| zip | VARCHAR | |
| access_notes | TEXT | Gate codes, dogs, etc. |
| service_notes | TEXT | Special instructions |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |
