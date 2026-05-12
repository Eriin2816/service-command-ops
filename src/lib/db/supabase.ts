/**
 * Standard Supabase client exports.
 *
 * supabaseAdmin — service role key, bypasses RLS.
 *   Use in API routes and server-only logic. Never import in client components.
 *   Tenant isolation is enforced at the application layer (getTenantId(session)).
 *
 * supabase — anon key, subject to RLS policies.
 *   Safe for server components that set session vars, or future browser-direct reads.
 *   For React client components, use createBrowserClient() from ./browser.ts instead.
 */

// Re-export the service role client under the standard name.
export { db as supabaseAdmin } from "./client";

import { createClient } from "@supabase/supabase-js";

// Anon-key client — module-level singleton, safe for server-side use.
// For React client components that need a fresh instance per render, use ./browser.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
