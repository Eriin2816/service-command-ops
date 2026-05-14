import "next-auth";
import "next-auth/jwt";
import type { UserRole } from "@/types/technician";

// Re-export so callers can import UserRole from either location.
export type { UserRole };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
      tenant_id: string;
      /** Work-order-store technician record ID (e.g. "tech-001"). Only set for TECHNICIAN role. */
      technician_id?: string;
      avatar_url?: string | null;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    tenant_id: string;
    technician_id?: string;
    avatar_url?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenant_id: string;
    technician_id?: string;
    avatar_url?: string | null;
  }
}
