-- Migration: make property_id nullable on work_orders
-- Property linking is Phase 3. Until then, work orders created from the UI
-- do not require a linked property record.
ALTER TABLE work_orders ALTER COLUMN property_id DROP NOT NULL;
