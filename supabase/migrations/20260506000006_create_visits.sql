-- =============================================================================
-- Migration 006 — visits
-- One visit = one physical service call. A work order can have many visits
-- (e.g. initial visit + follow-up). The checklist column stores a JSONB
-- snapshot of ChecklistItem[] that is updated atomically during the visit.
-- Structured checklist history lives in the checklist_items table (007).
-- =============================================================================

CREATE TABLE visits (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_order_id     UUID         NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  property_id       UUID         NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  technician_id     UUID         REFERENCES users(id) ON DELETE SET NULL,

  status            visit_status NOT NULL DEFAULT 'scheduled',
  scheduled_date    DATE         NOT NULL,

  -- Inline checklist snapshot — updated atomically on PATCH /api/visits/[id].
  -- Format: [{ id, label, completed, notes? }]
  -- Structured history is normalized into checklist_items (see migration 007).
  checklist         JSONB        NOT NULL DEFAULT '[]',

  -- Free-text field — technician notes for the whole visit.
  -- Individual note records live in technician_notes (see migration 008).
  technician_notes  TEXT,

  -- Photo public URLs (Supabase Storage). Structured records in photos (see 009).
  photo_urls        TEXT[]       NOT NULL DEFAULT '{}',

  completed_at      TIMESTAMPTZ,
  estimate_flagged  BOOLEAN      NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- A visit can only be completed if completed_at is set
  CONSTRAINT chk_completed_at CHECK (
    status != 'completed' OR completed_at IS NOT NULL
  )
);

CREATE INDEX idx_visits_tenant_id      ON visits (tenant_id);
CREATE INDEX idx_visits_work_order_id  ON visits (work_order_id);
CREATE INDEX idx_visits_property_id    ON visits (property_id);
CREATE INDEX idx_visits_technician_id  ON visits (technician_id) WHERE technician_id IS NOT NULL;
CREATE INDEX idx_visits_scheduled_date ON visits (tenant_id, scheduled_date);
CREATE INDEX idx_visits_estimate_flag  ON visits (tenant_id, estimate_flagged) WHERE estimate_flagged = true;

-- Enforce idempotency: at most one active (non-cancelled/skipped) visit per work order at a time
-- (optional — remove if the business allows parallel visits on one WO)
CREATE UNIQUE INDEX idx_visits_one_active_per_wo
  ON visits (work_order_id)
  WHERE status NOT IN ('cancelled', 'skipped', 'completed');

CREATE TRIGGER visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
