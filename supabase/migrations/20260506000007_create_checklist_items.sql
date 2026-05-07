-- =============================================================================
-- Migration 007 — checklist_items
-- Structured, normalized checklist records per visit.
-- Complements the JSONB snapshot on visits.checklist — this table is the
-- source of truth for reporting and history; the JSONB is the live working copy.
-- When a visit is completed, its checklist JSONB can be materialized here.
-- =============================================================================

CREATE TABLE checklist_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visit_id    UUID        NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  completed   BOOLEAN     NOT NULL DEFAULT false,
  notes       TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_tenant_id  ON checklist_items (tenant_id);
CREATE INDEX idx_checklist_items_visit_id   ON checklist_items (visit_id);

CREATE TRIGGER checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
