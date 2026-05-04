# Entity Relationships

- tenant → has many → work_orders, properties, users
- property → has many → work_orders, visits, equipment_records
- work_order → has many → visits
- visit → has many → checklist_items, photos, technician_notes
- visit → belongs to → work_order, property, technician
- work_order → has one → estimate_handoff (when flagged)
