-- =============================================================================
-- Migration 003 — users
-- All platform users regardless of role. Technicians are users with
-- role = 'technician'. auth_provider_id links to the NextAuth user ID.
-- =============================================================================

CREATE TABLE users (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_provider_id  TEXT        UNIQUE,            -- NextAuth user.id ("user-001", or UUID after real auth)
  email             TEXT        NOT NULL,
  name              TEXT        NOT NULL,
  phone             TEXT,
  role              user_role   NOT NULL DEFAULT 'technician',
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id       ON users (tenant_id);
CREATE INDEX idx_users_role            ON users (tenant_id, role);
CREATE INDEX idx_users_auth_provider   ON users (auth_provider_id);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed: demo users matching src/lib/auth/config.ts
INSERT INTO users (id, tenant_id, auth_provider_id, email, name, role, is_active)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'user-001',
    'admin@showtime.local',
    'Alex (Admin)',
    'tenant_admin',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'user-002',
    'tech@showtime.local',
    'Jordan (Tech)',
    'technician',
    true
  );
