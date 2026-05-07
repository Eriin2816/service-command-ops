-- =============================================================================
-- Migration 002 — tenants
-- Root table of the multi-tenant hierarchy. All other tables FK here.
-- =============================================================================

CREATE TABLE tenants (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT        NOT NULL,
  slug                    TEXT        NOT NULL UNIQUE,               -- URL-safe identifier, e.g. "showtime-pools"
  ghl_location_id         TEXT        UNIQUE,                        -- GHL location ID; drives inbound webhook routing
  ghl_api_token_encrypted TEXT,                                      -- Encrypted GHL private integration token
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  plan                    TEXT,                                      -- "starter" | "pro" | "enterprise" — NULL until billing is wired
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed: Showtime Pool Service development tenant
-- Remove or replace before production.
INSERT INTO tenants (id, name, slug, ghl_location_id, is_active, plan)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Showtime Pool Service',
  'showtime-pools',
  NULL,
  true,
  'starter'
);
