"use client";

/**
 * Browser-side Supabase client — uses the anon key.
 *
 * Subject to Row Level Security. Safe to use in client components.
 * All mutations that require elevated permissions should go through
 * Next.js API routes (which use the server client with service role key).
 *
 * Call createBrowserClient() once per component tree and memoize the result
 * to avoid creating multiple instances.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export type { Database } from "./types";
