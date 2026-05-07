/**
 * Server-side Supabase client — uses the service role key.
 *
 * The service role key bypasses Row Level Security. Tenant isolation is
 * enforced at the application layer via getTenantId(session) in every API
 * route. RLS policies provide defense-in-depth for direct DB access.
 *
 * Never import this file in client components — it exposes the service key.
 * For browser use, import from ./browser.ts instead.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Untyped Supabase client — all type safety is provided at the query-layer
 * via explicit `as unknown as RowType` casts in src/lib/db/queries/*.ts.
 * This avoids fighting Supabase v2's strict hand-written Database type inference
 * (which requires the exact auto-generated shape from `supabase gen types typescript`).
 *
 * `createClient` is safe to call with placeholder values — it creates a client
 * object without any network connection. Queries fail at runtime if real
 * credentials aren't set in .env.local.
 *
 * Once NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set,
 * replace with: createClient<Database>(url, key, options)
 * and run: npx supabase gen types typescript --local > src/lib/db/types.ts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type { Database } from "./types";
