import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/db/supabase";
import { UserRole } from "@/types/technician";

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

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("id, email, password_hash, name, role, tenant_id, is_active")
          .eq("email", credentials.email.toLowerCase())
          .eq("is_active", true)
          .single();

        if (error || !user) {
          console.warn("[auth] Failed login — user not found:", credentials.email);
          return null;
        }

        if (!user.password_hash) {
          console.warn("[auth] Failed login — no password_hash set for user:", credentials.email);
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
        if (!passwordMatch) {
          console.warn("[auth] Failed login — incorrect password for:", credentials.email);
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          tenant_id: user.tenant_id,
          // For TECHNICIAN role, the user ID IS the technician ID in this schema
          technician_id: user.role === UserRole.TECHNICIAN ? user.id : undefined,
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
