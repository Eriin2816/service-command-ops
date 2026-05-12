import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { generateAllActiveVisits } from "@/lib/scheduling/generate-visits";

/**
 * GET /api/cron/generate-visits
 * Called by Vercel Cron every Monday at 6 AM UTC.
 * Generates work orders + visits for all active recurring schedules
 * across all tenants for the next 4 weeks.
 *
 * Protected by CRON_SECRET header. Set CRON_SECRET in Vercel env vars
 * and configure the same value in vercel.json cron authorization.
 */

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all tenant IDs
    const { data: tenants, error: tenantError } = await db
      .from("tenants")
      .select("id");

    if (tenantError) throw new Error(`Failed to fetch tenants: ${tenantError.message}`);

    const results: Record<string, { created: number; skipped: number; schedules: number }> = {};

    for (const tenant of tenants ?? []) {
      results[tenant.id] = await generateAllActiveVisits(tenant.id, 4);
    }

    const totals = Object.values(results).reduce(
      (acc, r) => ({
        created:   acc.created   + r.created,
        skipped:   acc.skipped   + r.skipped,
        schedules: acc.schedules + r.schedules,
      }),
      { created: 0, skipped: 0, schedules: 0 }
    );

    console.log(`[cron] generate-visits complete — ${totals.schedules} schedules, ${totals.created} created, ${totals.skipped} skipped`);

    return NextResponse.json({ ok: true, totals, byTenant: results });
  } catch (err) {
    console.error("[cron] generate-visits failed:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
