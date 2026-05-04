# estimate_handoffs Schema

## Table: estimate_handoffs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | FK → tenants.id |
| work_order_id | UUID | FK → work_orders.id, unique (one handoff per WO) |
| visit_id | UUID | FK → visits.id — the visit that triggered the flag |
| status | ENUM | EstimateHandoffStatus |
| flagged_by_technician_id | UUID | FK → users.id |
| flagged_at | TIMESTAMPTZ | When technician flagged |
| flagged_notes | TEXT | Technician's description of what needs estimating |
| sent_to_ghl_at | TIMESTAMPTZ | When office sent to GHL |
| ghl_opportunity_id | VARCHAR | GHL opportunity reference (may differ from WO's) |
| estimate_sent_at | TIMESTAMPTZ | When GHL sent estimate to customer |
| resolved_at | TIMESTAMPTZ | When approved or declined |
| resolution_notes | TEXT | Office notes on resolution |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |
