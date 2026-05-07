-- =============================================================================
-- Migration 010 — estimate_handoffs
-- Tracks the estimate flag state machine independently of work_order status.
-- One record per estimate event on a work order; status transitions are
-- recorded as timestamp columns (flagged_at, sent_to_ghl_at, etc.) rather
-- than a separate audit log, since the state machine is simple and linear.
-- =============================================================================

CREATE TABLE estimate_handoffs (
  id                        UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID                    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_order_id             UUID                    NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  visit_id                  UUID                    REFERENCES visits(id) ON DELETE SET NULL,
  flagged_by_technician_id  UUID                    REFERENCES users(id) ON DELETE SET NULL,

  status                    estimate_handoff_status NOT NULL DEFAULT 'flagged',

  -- GHL task ID returned by POST /opportunities/{id}/tasks — used for follow-up lookups
  ghl_task_id               TEXT,

  -- State machine timestamps — each set once when the transition occurs
  flagged_at                TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  sent_to_ghl_at            TIMESTAMPTZ,
  estimate_sent_at          TIMESTAMPTZ,
  approved_at               TIMESTAMPTZ,
  declined_at               TIMESTAMPTZ,

  notes                     TEXT,

  created_at                TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  -- Only one open estimate handoff per work order at a time
  CONSTRAINT estimate_handoffs_one_open_per_wo UNIQUE (work_order_id)
);

CREATE INDEX idx_estimate_handoffs_tenant_id      ON estimate_handoffs (tenant_id);
CREATE INDEX idx_estimate_handoffs_work_order_id  ON estimate_handoffs (work_order_id);
CREATE INDEX idx_estimate_handoffs_status         ON estimate_handoffs (tenant_id, status);

CREATE TRIGGER estimate_handoffs_updated_at
  BEFORE UPDATE ON estimate_handoffs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
