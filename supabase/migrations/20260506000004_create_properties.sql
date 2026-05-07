-- =============================================================================
-- Migration 004 — properties
-- Customer service locations (pools). ServiceOps owns property data;
-- GHL owns the contact record. ghl_contact_id is a soft reference only.
-- pool_equipment stored as JSONB snapshot — not history.
-- =============================================================================

CREATE TABLE properties (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- GHL soft reference — nullable because properties can pre-date GHL sync
  ghl_contact_id  TEXT,

  -- Customer / location identity
  customer_name   TEXT        NOT NULL,
  address_line1   TEXT        NOT NULL,
  address_line2   TEXT,
  city            TEXT        NOT NULL,
  state           CHAR(2)     NOT NULL,        -- 2-letter abbreviation, e.g. "CA"
  zip             TEXT        NOT NULL,

  -- Access details — gate_code is a first-class field for at-a-glance visibility
  gate_code       TEXT,
  access_notes    TEXT,                        -- dogs, parking, key location, alarm, etc.
  service_notes   TEXT,                        -- standing instructions, e.g. "run backwash first"

  -- Pool equipment snapshot (JSONB). Structure mirrors src/types/property.ts PoolEquipment.
  -- Never overwritten from GHL — ServiceOps-only field.
  pool_equipment  JSONB,

  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_tenant_id       ON properties (tenant_id);
CREATE INDEX idx_properties_ghl_contact_id  ON properties (ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;
CREATE INDEX idx_properties_is_active       ON properties (tenant_id, is_active);

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
