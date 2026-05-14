-- =============================================================================
-- Migration — Create user_activity_log table
--
-- Records admin/office actions for audit trail purposes.
-- All routes use the service role key which bypasses RLS;
-- the policy below provides defense-in-depth for anon-key paths.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES public.tenants(id),
  user_id     UUID        NOT NULL REFERENCES public.users(id),
  action_type VARCHAR     NOT NULL,
  description VARCHAR     NOT NULL,
  entity_type VARCHAR,
  entity_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_tenant
  ON public.user_activity_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_user
  ON public.user_activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_created
  ON public.user_activity_log(created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_activity_log_select"
  ON public.user_activity_log FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "user_activity_log_insert"
  ON public.user_activity_log FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('tenant_admin', 'office_staff', 'platform_owner')
  );

-- Audit log rows are immutable — no UPDATE or DELETE policy
