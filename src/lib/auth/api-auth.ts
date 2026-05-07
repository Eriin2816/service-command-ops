import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getSession } from "./index";
import { UserRole } from "@/types/technician";
import { rolePermissions, type RolePermissions } from "@/config/roles";

export { getTenantId } from "./tenant";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type ApiAuthOk   = { ok: true;  session: Session };
export type ApiAuthFail = { ok: false; response: NextResponse };
export type ApiAuthResult = ApiAuthOk | ApiAuthFail;

// ---------------------------------------------------------------------------
// Response factories (new instance each call — avoids stream-reuse issues)
// ---------------------------------------------------------------------------

function unauthResponse(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized — sign in to continue" },
    { status: 401 }
  );
}

function forbiddenResponse(msg = "Forbidden — insufficient permissions"): NextResponse {
  return NextResponse.json({ error: msg }, { status: 403 });
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Requires a valid session.
 * Returns `{ ok: true, session }` or `{ ok: false, response: 401 }`.
 *
 * Usage:
 *   const auth = await requireApiAuth();
 *   if (!auth.ok) return auth.response;
 *   const { session } = auth;
 */
export async function requireApiAuth(): Promise<ApiAuthResult> {
  const session = await getSession();
  if (!session) return { ok: false, response: unauthResponse() };
  return { ok: true, session };
}

/**
 * Requires a valid session AND the user's role to be in `allowedRoles`.
 * Returns `{ ok: false, response: 403 }` when the role check fails.
 */
export async function requireApiRole(...allowedRoles: UserRole[]): Promise<ApiAuthResult> {
  const result = await requireApiAuth();
  if (!result.ok) return result;
  if (!allowedRoles.includes(result.session.user.role as UserRole)) {
    return { ok: false, response: forbiddenResponse() };
  }
  return result;
}

/**
 * Requires a valid session AND a specific RolePermissions flag to be `true`.
 * Derives the check from `rolePermissions[role][permission]`.
 *
 * Example: requirePermission("canViewReports") blocks TECHNICIAN + OFFICE_STAFF.
 */
export async function requirePermission(
  permission: keyof RolePermissions
): Promise<ApiAuthResult> {
  const result = await requireApiAuth();
  if (!result.ok) return result;

  const role = result.session.user.role as UserRole;
  const allowed = rolePermissions[role]?.[permission] ?? false;

  if (!allowed) {
    return {
      ok: false,
      response: forbiddenResponse(
        `Forbidden — your role does not have the '${permission}' permission`
      ),
    };
  }

  return result;
}

/**
 * Returns true when the session user is a TECHNICIAN who can only see their
 * own assigned jobs. Use this to decide whether to scope a query.
 */
export function isTechnicianScoped(session: Session): boolean {
  return (session.user.role as UserRole) === UserRole.TECHNICIAN;
}
