import { type NextRequest, NextResponse } from "next/server";
import { listWorkOrders } from "@/lib/db/queries/work-orders";
import { WorkOrderStatus, ServiceCategory } from "@/types/work-order";
import { requirePermission, getTenantId } from "@/lib/auth/api-auth";

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface StatusRow {
  status: WorkOrderStatus;
  count: number;
  pct: number;
}

export interface CategoryRow {
  category: ServiceCategory;
  count: number;
  pct: number;
  completed: number;
  completion_rate: number;
}

export interface TechRow {
  technician_id: string | null;
  technician_name: string;
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  completion_rate: number;
}

export interface RangeReport {
  tenant_id: string;
  date_from: string;
  date_to: string;
  generated_at: string;
  total_in_range: number;
  completed_in_range: number;
  completion_rate: number;
  by_status: StatusRow[];
  by_category: CategoryRow[];
  by_technician: TechRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ACTIVE_STATUSES = new Set<WorkOrderStatus>([
  WorkOrderStatus.NEW,
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.ESTIMATE_NEEDED,
  WorkOrderStatus.NEEDS_FOLLOW_UP,
]);

// ---------------------------------------------------------------------------
// GET /api/reports/range
//
// OFFICE_STAFF / TECHNICIAN: blocked (canViewReports: false).
// TENANT_ADMIN / READ_ONLY_OWNER / PLATFORM_OWNER: allowed.
//
// tenant_id is derived from session — query param is ignored.
//
// Query params:
//   date_from — YYYY-MM-DD (must be paired with date_to)
//   date_to   — YYYY-MM-DD (must be paired with date_from)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requirePermission("canViewReports");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { searchParams } = request.nextUrl;

  const rawFrom = searchParams.get("date_from") ?? undefined;
  const rawTo   = searchParams.get("date_to")   ?? undefined;

  if ((rawFrom && !rawTo) || (!rawFrom && rawTo)) {
    return NextResponse.json(
      { error: "date_from and date_to must both be provided or both omitted" },
      { status: 400 }
    );
  }

  if (rawFrom && !ISO_DATE_RE.test(rawFrom)) {
    return NextResponse.json({ error: "Invalid date_from — expected YYYY-MM-DD" }, { status: 400 });
  }
  if (rawTo && !ISO_DATE_RE.test(rawTo)) {
    return NextResponse.json({ error: "Invalid date_to — expected YYYY-MM-DD" }, { status: 400 });
  }
  if (rawFrom && rawTo && rawFrom > rawTo) {
    return NextResponse.json({ error: "date_from must be ≤ date_to" }, { status: 400 });
  }

  const all = await listWorkOrders({ tenant_id: tenantId });

  const filtered =
    rawFrom && rawTo
      ? all.filter(
          (wo) =>
            wo.scheduled_date !== undefined &&
            wo.scheduled_date >= rawFrom &&
            wo.scheduled_date <= rawTo
        )
      : all;

  const total = filtered.length;
  const completedCount = filtered.filter(
    (wo) => wo.status === WorkOrderStatus.COMPLETED
  ).length;

  // ── Status breakdown ───────────────────────────────────────────────────────

  const statusMap = new Map<WorkOrderStatus, number>(
    Object.values(WorkOrderStatus).map((s) => [s, 0])
  );
  for (const wo of filtered) {
    statusMap.set(wo.status, (statusMap.get(wo.status) ?? 0) + 1);
  }

  const by_status: StatusRow[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Category breakdown ─────────────────────────────────────────────────────

  const catMap = new Map<ServiceCategory, { count: number; completed: number }>();

  for (const wo of filtered) {
    const cur = catMap.get(wo.service_category) ?? { count: 0, completed: 0 };
    cur.count += 1;
    if (wo.status === WorkOrderStatus.COMPLETED) cur.completed += 1;
    catMap.set(wo.service_category, cur);
  }

  const by_category: CategoryRow[] = Array.from(catMap.entries())
    .filter(([, v]) => v.count > 0)
    .map(([category, v]) => ({
      category,
      count: v.count,
      pct: total > 0 ? Math.round((v.count / total) * 100) : 0,
      completed: v.completed,
      completion_rate: Math.round((v.completed / v.count) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // ── Technician breakdown ───────────────────────────────────────────────────

  const techMap = new Map<
    string,
    {
      technician_id: string | null;
      technician_name: string;
      total: number;
      completed: number;
      pending: number;
      cancelled: number;
    }
  >();

  for (const wo of filtered) {
    const key  = wo.assigned_technician_id ?? "__unassigned__";
    const name = wo.assigned_technician_name ?? "Unassigned";

    const cur = techMap.get(key) ?? {
      technician_id:   wo.assigned_technician_id ?? null,
      technician_name: name,
      total:     0,
      completed: 0,
      pending:   0,
      cancelled: 0,
    };

    cur.total += 1;
    if (wo.status === WorkOrderStatus.COMPLETED) {
      cur.completed += 1;
    } else if (wo.status === WorkOrderStatus.CANCELLED) {
      cur.cancelled += 1;
    } else if (ACTIVE_STATUSES.has(wo.status)) {
      cur.pending += 1;
    }

    techMap.set(key, cur);
  }

  const by_technician: TechRow[] = Array.from(techMap.values())
    .map((t) => ({
      ...t,
      completion_rate: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0,
    }))
    .sort((a, b) => b.completed - a.completed || b.total - a.total);

  const report: RangeReport = {
    tenant_id:          tenantId,
    date_from:          rawFrom ?? "",
    date_to:            rawTo   ?? "",
    generated_at:       new Date().toISOString(),
    total_in_range:     total,
    completed_in_range: completedCount,
    completion_rate:    total > 0 ? Math.round((completedCount / total) * 100) : 0,
    by_status,
    by_category,
    by_technician,
  };

  return NextResponse.json({ data: report });
}
