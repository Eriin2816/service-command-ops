-- =============================================================================
-- Migration 008 — technician_notes
-- Individual note records attached to a visit — structured alternative to
-- visits.technician_notes (plain text). Useful when multiple techs work
-- the same job or when notes need individual attribution / timestamps.
-- =============================================================================

CREATE TABLE technician_notes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visit_id       UUID        NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  technician_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
  body           TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tech_notes_tenant_id     ON technician_notes (tenant_id);
CREATE INDEX idx_tech_notes_visit_id      ON technician_notes (visit_id);
CREATE INDEX idx_tech_notes_technician_id ON technician_notes (technician_id) WHERE technician_id IS NOT NULL;

CREATE TRIGGER technician_notes_updated_at
  BEFORE UPDATE ON technician_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
