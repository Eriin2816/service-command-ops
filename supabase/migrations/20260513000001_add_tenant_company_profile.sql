-- =============================================================================
-- Migration 014 — Add company profile fields to tenants
-- =============================================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS owner_name       TEXT,
  ADD COLUMN IF NOT EXISTS business_phone   TEXT,
  ADD COLUMN IF NOT EXISTS business_email   TEXT,
  ADD COLUMN IF NOT EXISTS service_area     TEXT,
  ADD COLUMN IF NOT EXISTS last_webhook_at  TIMESTAMPTZ;
