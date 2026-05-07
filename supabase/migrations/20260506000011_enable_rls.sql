-- =============================================================================
-- Migration 011 — Row Level Security (RLS)
--
-- ARCHITECTURE NOTE:
-- All API routes use the service role key (src/lib/db/client.ts) which
-- bypasses RLS. Tenant isolation for those paths is enforced at the
-- application layer via getTenantId(session) in every route.
--
-- These RLS policies provide defense-in-depth for:
--   1. Direct Supabase client calls from the browser (anon key)
--   2. Future migration to Supabase Auth (auth.uid() / auth.jwt() claims)
--   3. Any ad-hoc queries run against the DB with the anon key
--
-- Policy strategy:
--   - Uses COALESCE(auth.jwt() ->> 'tenant_id', current_setting('app.current_tenant_id', true))
--     so policies work with EITHER Supabase Auth JWT claims OR a session variable
--     set explicitly before a query (for NextAuth-backed server paths using anon key).
--   - Service role key bypasses all policies automatically (Supabase built-in).
--   - Technicians are additionally scoped on visits/work_orders by their user ID
--     when using the anon key directly.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper function: resolve current tenant ID from JWT claim or session var
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  )
$$;

-- ---------------------------------------------------------------------------
-- Helper function: resolve current user ID from JWT or session var
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_id()
  RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_id')::uuid,
    NULLIF(current_setting('app.current_user_id', true), '')::uuid
  )
$$;

-- ---------------------------------------------------------------------------
-- Helper function: resolve current user role from JWT or session var
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_role()
  RETURNS user_role LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role')::user_role,
    NULLIF(current_setting('app.current_user_role', true), '')::user_role
  )
$$;

-- =============================================================================
-- TENANTS
-- =============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Only platform owners can see all tenants; others see only their own
CREATE POLICY "tenants_select"
  ON tenants FOR SELECT
  USING (
    current_user_role() = 'platform_owner'
    OR id = current_tenant_id()
  );

CREATE POLICY "tenants_update"
  ON tenants FOR UPDATE
  USING (id = current_tenant_id())
  WITH CHECK (id = current_tenant_id());

-- Only platform owners can create tenants (no INSERT policy for others)
CREATE POLICY "tenants_insert_platform_owner"
  ON tenants FOR INSERT
  WITH CHECK (current_user_role() = 'platform_owner');

-- No DELETE policy — tenants are never deleted via API; deactivate with is_active = false

-- =============================================================================
-- USERS
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tenant members see all users in their tenant
CREATE POLICY "users_select_own_tenant"
  ON users FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Admins and office staff can create users in their tenant
CREATE POLICY "users_insert"
  ON users FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'platform_owner')
  );

-- Admins can update users in their tenant; users can update themselves
CREATE POLICY "users_update"
  ON users FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('tenant_admin', 'platform_owner')
      OR id = current_user_id()
    )
  )
  WITH CHECK (tenant_id = current_tenant_id());

-- Only admins can delete (soft-delete preferred — use is_active = false)
CREATE POLICY "users_delete"
  ON users FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'platform_owner')
  );

-- =============================================================================
-- PROPERTIES
-- =============================================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- All tenant members can read properties in their tenant
CREATE POLICY "properties_select"
  ON properties FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Admins and office staff can create properties
CREATE POLICY "properties_insert"
  ON properties FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  );

-- Admins and office staff can update properties
CREATE POLICY "properties_update"
  ON properties FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  )
  WITH CHECK (tenant_id = current_tenant_id());

-- Only admins can delete (soft-delete with is_active preferred)
CREATE POLICY "properties_delete"
  ON properties FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'platform_owner')
  );

-- =============================================================================
-- WORK ORDERS
-- =============================================================================
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Technicians see only their assigned work orders;
-- all other authenticated tenant members see all
CREATE POLICY "work_orders_select"
  ON work_orders FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() != 'technician'
      OR assigned_technician_id = current_user_id()
    )
  );

-- Admins and office staff can create work orders
CREATE POLICY "work_orders_insert"
  ON work_orders FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  );

-- Admins and office staff can update work orders; technicians cannot
CREATE POLICY "work_orders_update"
  ON work_orders FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'read_only_owner', 'platform_owner')
  )
  WITH CHECK (tenant_id = current_tenant_id());

-- Only admins can delete work orders
CREATE POLICY "work_orders_delete"
  ON work_orders FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'platform_owner')
  );

-- =============================================================================
-- VISITS
-- =============================================================================
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Technicians see only their assigned visits
CREATE POLICY "visits_select"
  ON visits FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() != 'technician'
      OR technician_id = current_user_id()
    )
  );

-- Admins and office staff can create visits; technicians cannot
CREATE POLICY "visits_insert"
  ON visits FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  );

-- Admins, office staff, and technicians (their own visits) can update
CREATE POLICY "visits_update"
  ON visits FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
      OR (current_user_role() = 'technician' AND technician_id = current_user_id())
    )
  )
  WITH CHECK (tenant_id = current_tenant_id());

-- Only admins can delete visits
CREATE POLICY "visits_delete"
  ON visits FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'platform_owner')
  );

-- =============================================================================
-- CHECKLIST ITEMS
-- =============================================================================
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_select"
  ON checklist_items FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "checklist_items_insert"
  ON checklist_items FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'technician', 'platform_owner')
  );

CREATE POLICY "checklist_items_update"
  ON checklist_items FOR UPDATE
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "checklist_items_delete"
  ON checklist_items FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  );

-- =============================================================================
-- TECHNICIAN NOTES
-- =============================================================================
ALTER TABLE technician_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technician_notes_select"
  ON technician_notes FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "technician_notes_insert"
  ON technician_notes FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'technician', 'platform_owner')
  );

-- Authors (technician_id) or admins can update notes
CREATE POLICY "technician_notes_update"
  ON technician_notes FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
      OR technician_id = current_user_id()
    )
  )
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "technician_notes_delete"
  ON technician_notes FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('tenant_admin', 'platform_owner')
      OR technician_id = current_user_id()
    )
  );

-- =============================================================================
-- PHOTOS
-- =============================================================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select"
  ON photos FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "photos_insert"
  ON photos FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'technician', 'platform_owner')
  );

-- Photos are immutable after upload — no UPDATE policy
-- To replace: DELETE + re-upload

CREATE POLICY "photos_delete"
  ON photos FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('tenant_admin', 'platform_owner')
      OR technician_id = current_user_id()
    )
  );

-- =============================================================================
-- ESTIMATE HANDOFFS
-- =============================================================================
ALTER TABLE estimate_handoffs ENABLE ROW LEVEL SECURITY;

-- All tenant members can see estimate handoffs (needed for dashboard)
CREATE POLICY "estimate_handoffs_select"
  ON estimate_handoffs FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Admins and office staff manage estimate handoffs
CREATE POLICY "estimate_handoffs_insert"
  ON estimate_handoffs FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'technician', 'platform_owner')
  );

CREATE POLICY "estimate_handoffs_update"
  ON estimate_handoffs FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  )
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "estimate_handoffs_delete"
  ON estimate_handoffs FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'platform_owner')
  );
