-- Add ghl_trigger_stage to work_orders for per-stage idempotency on webhook intake.
-- Allows two work orders for the same GHL opportunity (e.g. Diagnosis Booked + Estimate Approved).
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS ghl_trigger_stage TEXT;
