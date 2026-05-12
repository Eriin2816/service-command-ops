/**
 * Seed script — inserts development data into Supabase.
 *
 * Run with:  npx tsx scripts/seed.ts
 * Requires:  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Safe to re-run: all inserts use ON CONFLICT DO NOTHING so existing rows
 * are left unchanged.
 *
 * Dev credentials seeded:
 *   admin@showtime.local / admin2024
 *   tech@showtime.local  / tech2024
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// IDs (stable — match src/lib/auth/config.ts DEMO_USERS)
// ---------------------------------------------------------------------------

const TENANT_ID  = "a0000000-0000-0000-0000-000000000001";
const ADMIN_ID   = "b0000000-0000-0000-0000-000000000001";
const TECH_ID    = "b0000000-0000-0000-0000-000000000002";
const PROP_1_ID  = "c0000000-0000-0000-0000-000000000001";
const PROP_2_ID  = "c0000000-0000-0000-0000-000000000002";
const WO_1_ID    = "d0000000-0000-0000-0000-000000000001";
const WO_2_ID    = "d0000000-0000-0000-0000-000000000002";
const WO_3_ID    = "d0000000-0000-0000-0000-000000000003";

async function seed() {
  console.log("Seeding Supabase database…\n");

  // Pre-hash passwords (cost factor 12 — same as production)
  const [adminHash, techHash] = await Promise.all([
    bcrypt.hash("admin2024", 12),
    bcrypt.hash("tech2024", 12),
  ]);

  // ── 1. Tenant ──────────────────────────────────────────────────────────────
  const { error: tenantErr } = await db.from("tenants").upsert(
    {
      id:   TENANT_ID,
      name: "Showtime Pool Service",
      slug: "showtime-pools",
      is_active: true,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (tenantErr) console.error("tenants:", tenantErr.message);
  else console.log("✓ tenant");

  // ── 2. Users ───────────────────────────────────────────────────────────────
  // ignoreDuplicates: false so password_hash is written even if user row already exists
  const { error: usersErr } = await db.from("users").upsert(
    [
      {
        id:               ADMIN_ID,
        tenant_id:        TENANT_ID,
        auth_provider_id: "user-001",
        email:            "admin@showtime.local",
        name:             "Alex (Admin)",
        role:             "tenant_admin",
        password_hash:    adminHash,
        is_active:        true,
      },
      {
        id:               TECH_ID,
        tenant_id:        TENANT_ID,
        auth_provider_id: "user-002",
        email:            "tech@showtime.local",
        name:             "Jordan (Tech)",
        role:             "technician",
        password_hash:    techHash,
        is_active:        true,
      },
    ],
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (usersErr) console.error("users:", usersErr.message);
  else console.log("✓ users (admin + technician) — password hashes written");

  // ── 3. Properties ──────────────────────────────────────────────────────────
  const { error: propErr } = await db.from("properties").upsert(
    [
      {
        id:            PROP_1_ID,
        tenant_id:     TENANT_ID,
        customer_name: "Rodriguez Family",
        address_line1: "1234 Palm Drive",
        city:          "San Diego",
        state:         "CA",
        zip:           "92101",
        gate_code:     "4892",
        access_notes:  "Gate is on the left side of the house. Beware of small dog.",
        service_notes: "Salt water pool. Check chlorine weekly.",
        pool_equipment: {
          pool_size_gallons: 15000,
          pool_shape:        "rectangular",
          pump: { make: "Pentair", model: "IntelliFlo 3", type: "variable_speed" },
          filter: { make: "Hayward", model: "DE4820", type: "de" },
          sanitizer: { type: "salt_chlorinator" },
        },
        is_active: true,
      },
      {
        id:            PROP_2_ID,
        tenant_id:     TENANT_ID,
        customer_name: "Johnson Residence",
        address_line1: "5678 Ocean View Blvd",
        address_line2: "Unit B",
        city:          "Chula Vista",
        state:         "CA",
        zip:           "91910",
        access_notes:  "No gate — park on the street.",
        service_notes: "Older equipment. Heater runs on propane.",
        pool_equipment: {
          pool_size_gallons: 20000,
          pool_shape:        "kidney",
          pump:   { make: "Jandy", model: "VS FloPro", type: "variable_speed" },
          filter: { make: "Pentair", model: "Triton II", type: "sand" },
          heater: { make: "Raypak", model: "P-R406A", type: "gas" },
        },
        is_active: true,
      },
    ],
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (propErr) console.error("properties:", propErr.message);
  else console.log("✓ properties");

  // ── 4. Work Orders ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const { error: woErr } = await db.from("work_orders").upsert(
    [
      {
        id:               WO_1_ID,
        tenant_id:        TENANT_ID,
        property_id:      PROP_1_ID,
        title:            "Weekly Pool Maintenance — Rodriguez",
        status:           "in_progress",
        priority:         "normal",
        service_category: "weekly_pool_maintenance",
        assigned_technician_id: TECH_ID,
        scheduled_date:   today,
        scheduled_time_start: "09:00",
        scheduled_time_end:   "10:00",
        estimate_handoff_status: "not_needed",
        ghl_sync_failed:  false,
      },
      {
        id:               WO_2_ID,
        tenant_id:        TENANT_ID,
        property_id:      PROP_2_ID,
        title:            "Filter Cleaning — Johnson",
        status:           "new",
        priority:         "high",
        service_category: "filter_cleaning",
        assigned_technician_id: TECH_ID,
        scheduled_date:   today,
        estimate_handoff_status: "not_needed",
        ghl_sync_failed:  false,
      },
      {
        id:               WO_3_ID,
        tenant_id:        TENANT_ID,
        property_id:      PROP_1_ID,
        title:            "Heater Inspection — Rodriguez",
        status:           "completed",
        priority:         "normal",
        service_category: "heater_service",
        assigned_technician_id: TECH_ID,
        completed_at:     new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimate_handoff_status: "not_needed",
        ghl_sync_failed:  false,
      },
    ],
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (woErr) console.error("work_orders:", woErr.message);
  else console.log("✓ work orders");

  // ── 5. Visits ──────────────────────────────────────────────────────────────
  const POOL_CHECKLIST = [
    { id: "chk-1", label: "Check and adjust pH",         completed: false },
    { id: "chk-2", label: "Check and adjust chlorine",   completed: false },
    { id: "chk-3", label: "Brush walls and steps",        completed: false },
    { id: "chk-4", label: "Vacuum pool floor",            completed: false },
    { id: "chk-5", label: "Empty skimmer and pump baskets", completed: false },
    { id: "chk-6", label: "Check filter pressure",        completed: false },
    { id: "chk-7", label: "Inspect equipment for leaks",  completed: false },
    { id: "chk-8", label: "Record chemical readings",     completed: false },
  ];

  const { error: visitErr } = await db.from("visits").upsert(
    [
      {
        id:               "e0000000-0000-0000-0000-000000000001",
        tenant_id:        TENANT_ID,
        work_order_id:    WO_1_ID,
        property_id:      PROP_1_ID,
        technician_id:    TECH_ID,
        status:           "in_progress",
        scheduled_date:   today,
        checklist:        POOL_CHECKLIST,
        photo_urls:       [],
        estimate_flagged: false,
      },
      {
        id:               "e0000000-0000-0000-0000-000000000002",
        tenant_id:        TENANT_ID,
        work_order_id:    WO_3_ID,
        property_id:      PROP_1_ID,
        technician_id:    TECH_ID,
        status:           "completed",
        scheduled_date:   new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        checklist:        POOL_CHECKLIST.map((i) => ({ ...i, completed: true })),
        technician_notes: "Heater pilot light was out — re-lit and tested. Running normally.",
        photo_urls:       [],
        estimate_flagged: false,
        completed_at:     new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (visitErr) console.error("visits:", visitErr.message);
  else console.log("✓ visits");

  console.log("\nSeed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
