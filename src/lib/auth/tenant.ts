import type { Session } from "next-auth";

/**
 * Extracts and validates the tenant_id from a verified session.
 *
 * Security rule: "tenant_id filter on every database query."
 * Every API route that touches the data layer must call this and pass the
 * result to every store function — never fall back to a hardcoded default.
 *
 * Throws if tenant_id is missing, which indicates an auth misconfiguration
 * and should never happen in practice. The throw is intentional: silent
 * fallback to a wrong tenant would be a data-isolation bug.
 */
export function getTenantId(session: Session): string {
  const id = session.user.tenant_id;
  if (!id) {
    console.error("[security] getTenantId: session is missing tenant_id", {
      userId: session.user.id,
    });
    throw new Error(
      "Session missing tenant_id — check NextAuth configuration (src/lib/auth/config.ts)"
    );
  }
  return id;
}
