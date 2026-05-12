-- =============================================================================
-- Migration 014 — recurring_schedules
-- Stores repeating service schedules for properties.
-- The cron job at /api/cron/generate-visits reads active schedules and
-- creates work_orders + visits for the next N weeks, idempotently.
-- =============================================================================

CREATE TABLE recurring_schedules (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id      UUID             NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  technician_id    UUID             REFERENCES users(id) ON DELETE SET NULL,

  -- Recurrence
  frequency        TEXT             NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week      SMALLINT         NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Service window (stored as TIME so they inherit the app time-zone logic)
  time_start       TIME,
  time_end         TIME,

  service_category service_category NOT NULL,

  is_active        BOOLEAN          NOT NULL DEFAULT TRUE,
  starts_on        DATE             NOT NULL,
  ends_on          DATE,

  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_schedules_tenant    ON recurring_schedules (tenant_id);
CREATE INDEX idx_recurring_schedules_property  ON recurring_schedules (property_id);
CREATE INDEX idx_recurring_schedules_active    ON recurring_schedules (tenant_id, is_active) WHERE is_active = TRUE;

CREATE TRIGGER recurring_schedules_updated_at
  BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Add recurring_schedule_id to work_orders
-- Null on manually-created WOs; set on auto-generated recurring WOs.
-- ---------------------------------------------------------------------------

ALTER TABLE work_orders
  ADD COLUMN recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL;

CREATE INDEX idx_wo_recurring_schedule
  ON work_orders (recurring_schedule_id)
  WHERE recurring_schedule_id IS NOT NULL;
