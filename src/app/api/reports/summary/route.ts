import { NextResponse } from "next/server";
import { listWorkOrders } from "@/lib/db/queries/work-orders";
import {
  WorkOrderStatus,
  ServiceCategory,
  EstimateHandoffStatus,
} from "@/types/work-order";
import { requirePermission, getTenantId } from "@/lib/auth/api-auth";

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  generated_at: string;
  tenant_id: string;
  total_work_orders: number;
  total_today: number;
  completed_today: number;
  open_estimates: number;
  overdue: number;
  by_status: Record<WorkOrderStatus, number>;
  by_service_category: Record<ServiceCategory, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OPEN_ESTIMATE_STATUSES = new Set<EstimateHandoffStatus>([
  EstimateHandoffStatus.FLAGGED,
  EstimateHandoffStatus.SENT_TO_GHL,
  EstimateHandoffStatus.ESTIMATE_SENT,
]);

const NON_OVERDUE_STATUSES = new Set<WorkOrderStatus>([
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.CANCELLED,
]);

function zeroFilledStatusMap(): Record<WorkOrderStatus, number> {
  return Object.fromEntries(
    Object.values(WorkOrderStatus).map((s) => [s, 0])
  ) as Record<WorkOrderStatus, number>;
}

function zeroFilledCategoryMap(): Record<ServiceCategory, number> {
  return Object.fromEntries(
    Object.values(ServiceCategory).map((c) => [c, 0])
  ) as Record<ServiceCategory, number>;
}

// ---------------------------------------------------------------------------
// GET /api/reports/summary
//
// OFFICE_STAFF / TECHNICIAN: blocked (canViewReports: false).
// TENANT_ADMIN / READ_ONLY_OWNER / PLATFORM_OWNER: allowed.
//
// tenant_id is derived from session — query param is ignored.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  const auth = await requirePermission("canViewReports");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);
  const today = new Date().toISOString().slice(0, 10);

  let workOrders: Awaited<ReturnType<typeof listWorkOrders>>;
  try {
    workOrders = await listWorkOrders({ tenant_id: tenantId });
  } catch (err) {
    console.error("[api] GET /api/reports/summary failed:", err);
    // Return zero-filled summary so the dashboard renders an empty state rather than an error page.
    // The real error is logged above for Vercel runtime log inspection.
    return NextResponse.json({
      data: {
        generated_at:        new Date().toISOString(),
        tenant_id:           tenantId,
        total_work_orders:   0,
        total_today:         0,
        completed_today:     0,
        open_estimates:      0,
        overdue:             0,
        by_status:           zeroFilledStatusMap(),
        by_service_category: zeroFilledCategoryMap(),
      } satisfies DashboardSummary,
    });
  }

  let totalToday = 0;
  let completedToday = 0;
  let openEstimates = 0;
  let overdue = 0;

  const byStatus   = zeroFilledStatusMap();
  const byCategory = zeroFilledCategoryMap();

  for (const wo of workOrders) {
    byStatus[wo.status] += 1;
    byCategory[wo.service_category] += 1;

    if (wo.scheduled_date === today) {
      totalToday += 1;
      if (wo.status === WorkOrderStatus.COMPLETED) completedToday += 1;
    }

    if (OPEN_ESTIMATE_STATUSES.has(wo.estimate_handoff_status)) openEstimates += 1;

    if (
      wo.scheduled_date !== undefined &&
      wo.scheduled_date < today &&
      !NON_OVERDUE_STATUSES.has(wo.status)
    ) {
      overdue += 1;
    }
  }

  const summary: DashboardSummary = {
    generated_at:   new Date().toISOString(),
    tenant_id:      tenantId,
    total_work_orders: workOrders.length,
    total_today:    totalToday,
    completed_today: completedToday,
    open_estimates: openEstimates,
    overdue,
    by_status:          byStatus,
    by_service_category: byCategory,
  };

  return NextResponse.json({ data: summary });
}
