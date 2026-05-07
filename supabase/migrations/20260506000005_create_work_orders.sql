-- =============================================================================
-- Migration 005 — work_orders
-- Core job record. Linked to a property and optionally a GHL opportunity.
-- wo_number is a global auto-increment; app formats it as "WO-0001".
-- =============================================================================

CREATE TABLE work_orders (
  id                      UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID                    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id             UUID                    NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,

  -- Auto-incrementing display number — formatted as WO-XXXX by the application
  wo_number               INTEGER                 NOT NULL GENERATED ALWAYS AS IDENTITY,

  -- GHL soft references — nullable; work orders can exist without a GHL link
  ghl_contact_id          TEXT,
  ghl_opportunity_id      TEXT,

  -- Job details
  title                   TEXT                    NOT NULL,
  description             TEXT,
  status                  work_order_status       NOT NULL DEFAULT 'new',
  priority                priority                NOT NULL DEFAULT 'normal',
  service_category        service_category        NOT NULL,

  -- Assignment
  assigned_technician_id  UUID                    REFERENCES users(id) ON DELETE SET NULL,

  -- Scheduling
  scheduled_date          DATE,
  scheduled_time_start    TIME,
  scheduled_time_end      TIME,
  completed_at            TIMESTAMPTZ,

  -- Estimate handoff state machine (independent of status)
  estimate_handoff_status estimate_handoff_status NOT NULL DEFAULT 'not_needed',

  -- Outbound GHL sync tracking
  ghl_sync_failed         BOOLEAN                 NOT NULL DEFAULT false,

  created_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_scheduled_time_order CHECK (
    scheduled_time_end IS NULL
    OR scheduled_time_start IS NULL
    OR scheduled_time_end >= scheduled_time_start
  )
);

CREATE INDEX idx_wo_tenant_id           ON work_orders (tenant_id);
CREATE INDEX idx_wo_property_id         ON work_orders (property_id);
CREATE INDEX idx_wo_status              ON work_orders (tenant_id, status);
CREATE INDEX idx_wo_scheduled_date      ON work_orders (tenant_id, scheduled_date);
CREATE INDEX idx_wo_technician          ON work_orders (assigned_technician_id) WHERE assigned_technician_id IS NOT NULL;
CREATE INDEX idx_wo_ghl_opportunity     ON work_orders (ghl_opportunity_id) WHERE ghl_opportunity_id IS NOT NULL;
CREATE INDEX idx_wo_ghl_sync_failed     ON work_orders (tenant_id, ghl_sync_failed) WHERE ghl_sync_failed = true;

-- Enforce unique GHL opportunity per tenant (idempotency guard for webhook intake)
CREATE UNIQUE INDEX idx_wo_ghl_opportunity_tenant
  ON work_orders (ghl_opportunity_id, tenant_id)
  WHERE ghl_opportunity_id IS NOT NULL;

CREATE TRIGGER work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
