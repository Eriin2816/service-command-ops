-- =============================================================================
-- Migration 009 — photos
-- Before/after and general service photos. storage_path is the path within
-- the Supabase Storage bucket (e.g. "{tenant_id}/visits/{visit_id}/{filename}").
-- public_url is the CDN URL — populated after upload.
-- =============================================================================

CREATE TABLE photos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visit_id        UUID        NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  work_order_id   UUID        REFERENCES work_orders(id) ON DELETE SET NULL,
  property_id     UUID        REFERENCES properties(id) ON DELETE SET NULL,
  technician_id   UUID        REFERENCES users(id) ON DELETE SET NULL,

  -- Supabase Storage path — bucket-relative, e.g. "showtime-pools/visits/abc123/photo.jpg"
  storage_path    TEXT        NOT NULL UNIQUE,
  public_url      TEXT,

  caption         TEXT,
  taken_at        TIMESTAMPTZ,                -- Exif timestamp or server time if unavailable
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at — photos are immutable after upload; replace by deleting and re-uploading
);

CREATE INDEX idx_photos_tenant_id     ON photos (tenant_id);
CREATE INDEX idx_photos_visit_id      ON photos (visit_id);
CREATE INDEX idx_photos_work_order_id ON photos (work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_photos_property_id   ON photos (property_id)   WHERE property_id   IS NOT NULL;
