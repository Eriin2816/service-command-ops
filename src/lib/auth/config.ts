import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@/types/technician";

// ---------------------------------------------------------------------------
// MVP demo users — replace with DB lookup + bcrypt in production.
// Passwords can be overridden via env vars for staging/review environments.
// ---------------------------------------------------------------------------

interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenant_id: string;
  technician_id?: string; // work-order-store record ID; only set for TECHNICIAN role
}

const DEMO_USERS: DemoUser[] = [
  {
    id: "user-001",
    name: "Marcelo Taweng",
    email: "admin@showtime.local",
    password: process.env.ADMIN_PASSWORD ?? "admin2024",
    role: UserRole.TENANT_ADMIN,
    tenant_id: "tenant-showtime",
  },
  {
    id: "user-002",
    name: "Demo Technician",
    email: "tech@showtime.local",
    password: process.env.TECH_PASSWORD ?? "tech2024",
    role: UserRole.TECHNICIAN,
    tenant_id: "tenant-showtime",
    technician_id: "tech-001", // matches assigned_technician_id in mock work orders
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = DEMO_USERS.find(
          (u) =>
            u.email.toLowerCase() === credentials.email.toLowerCase() &&
            u.password === credentials.password
        );

        if (!user) {
          console.warn("[auth] Failed login attempt — invalid credentials");
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          technician_id: user.technician_id,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8-hour sessions
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenant_id = user.tenant_id;
        token.technician_id = user.technician_id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenant_id = token.tenant_id;
      session.user.technician_id = token.technician_id;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
