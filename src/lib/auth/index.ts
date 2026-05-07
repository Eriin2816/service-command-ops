import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./config";
import { UserRole } from "@/types/technician";

export { UserRole };
export { getTenantId } from "./tenant";

export async function getSession() {
  return nextAuthGetServerSession(authOptions);
}

/** Redirects to /login if unauthenticated. Returns the session. */
export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Redirects to /login if unauthenticated or role doesn't match. */
export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  if (session.user.role !== role) redirect("/dashboard/overview");
  return session;
}
