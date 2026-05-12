import { type NextRequest, NextResponse } from "next/server";
import { requireApiAuth, getTenantId } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/client";
import { EstimateHandoffStatus, WorkOrderStatus } from "@/types/work-order";

export interface NotificationCounts {
  overdue_work_orders: number;
  ghl_sync_failures: number;
  pending_estimates: number;
  total: number;
  // First 3 items for each category (for the dropdown preview)
  overdue_items: { id: string; wo_number: number; property_address: string }[];
  sync_failed_items: { id: string; wo_number: number; title: string }[];
  estimate_items: { id: string; wo_number: number; property_address: string }[];
}

export async function GET(_req: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  try {
    const [overdueRes, syncRes, estimateRes] = await Promise.all([
      // Overdue: scheduled_date < today, not completed/cancelled
      db
        .from("work_orders")
        .select("id, wo_number, property_id, properties(address_line1, city, state)")
        .eq("tenant_id", tenantId)
        .lt("scheduled_date", today)
        .not("status", "in", `(${WorkOrderStatus.COMPLETED},${WorkOrderStatus.CANCELLED})`)
        .not("scheduled_date", "is", null)
        .order("scheduled_date", { ascending: true })
        .limit(3),

      // GHL sync failed
      db
        .from("work_orders")
        .select("id, wo_number, title")
        .eq("tenant_id", tenantId)
        .eq("ghl_sync_failed", true)
        .order("updated_at", { ascending: false })
        .limit(3),

      // Estimates flagged (pending action)
      db
        .from("work_orders")
        .select("id, wo_number, property_id, properties(address_line1, city, state)")
        .eq("tenant_id", tenantId)
        .eq("estimate_handoff_status", EstimateHandoffStatus.FLAGGED)
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

    // Also get total counts (not capped at 3)
    const [overdueCount, syncCount, estimateCount] = await Promise.all([
      db
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .lt("scheduled_date", today)
        .not("status", "in", `(${WorkOrderStatus.COMPLETED},${WorkOrderStatus.CANCELLED})`)
        .not("scheduled_date", "is", null),

      db
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("ghl_sync_failed", true),

      db
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("estimate_handoff_status", EstimateHandoffStatus.FLAGGED),
    ]);

    type WoRow = { id: string; wo_number: number; properties: { address_line1: string; city: string; state: string } | null };
    type SyncRow = { id: string; wo_number: number; title: string };

    function fmtAddr(row: WoRow): string {
      const p = row.properties;
      if (!p) return "Unknown property";
      return `${p.address_line1}, ${p.city} ${p.state}`;
    }

    const overdueItems = ((overdueRes.data ?? []) as unknown as WoRow[]).map((r) => ({
      id: r.id,
      wo_number: r.wo_number,
      property_address: fmtAddr(r),
    }));

    const syncItems = ((syncRes.data ?? []) as unknown as SyncRow[]).map((r) => ({
      id: r.id,
      wo_number: r.wo_number,
      title: r.title,
    }));

    const estimateItems = ((estimateRes.data ?? []) as unknown as WoRow[]).map((r) => ({
      id: r.id,
      wo_number: r.wo_number,
      property_address: fmtAddr(r),
    }));

    const overdue = overdueCount.count ?? 0;
    const sync    = syncCount.count ?? 0;
    const estimate = estimateCount.count ?? 0;

    const payload: NotificationCounts = {
      overdue_work_orders: overdue,
      ghl_sync_failures:   sync,
      pending_estimates:   estimate,
      total:               overdue + sync + estimate,
      overdue_items:       overdueItems,
      sync_failed_items:   syncItems,
      estimate_items:      estimateItems,
    };

    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error("[api] GET /api/notifications failed:", err);
    return NextResponse.json(
      { data: { overdue_work_orders: 0, ghl_sync_failures: 0, pending_estimates: 0, total: 0, overdue_items: [], sync_failed_items: [], estimate_items: [] } }
    );
  }
}
