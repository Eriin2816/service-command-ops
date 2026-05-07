import { type NextRequest, NextResponse } from "next/server";
import { WorkOrderStatus, ServiceCategory } from "@/types/work-order";
import { NewWorkOrderSchema } from "@/lib/validation/work-order";
import { listWorkOrders, createWorkOrder } from "@/lib/db/queries/work-orders";
import { requireApiAuth, requirePermission, isTechnicianScoped, getTenantId } from "@/lib/auth/api-auth";

// ---------------------------------------------------------------------------
// GET /api/work-orders
//
// TENANT_ADMIN / OFFICE_STAFF / READ_ONLY_OWNER: full list, optional filters.
// TECHNICIAN: automatically scoped to their assigned_technician_id.
//
// Query params:
//   status        — WorkOrderStatus enum value
//   category      — ServiceCategory enum value
//   technician_id — filter by tech (ignored/overridden for TECHNICIAN role)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { searchParams } = request.nextUrl;

  const rawStatus   = searchParams.get("status")   ?? undefined;
  const rawCategory = searchParams.get("category") ?? undefined;

  if (rawStatus !== undefined && !Object.values(WorkOrderStatus).includes(rawStatus as WorkOrderStatus)) {
    return NextResponse.json(
      { error: `Invalid status value: "${rawStatus}"`, allowed: Object.values(WorkOrderStatus) },
      { status: 400 }
    );
  }

  if (rawCategory !== undefined && !Object.values(ServiceCategory).includes(rawCategory as ServiceCategory)) {
    return NextResponse.json(
      { error: `Invalid category value: "${rawCategory}"`, allowed: Object.values(ServiceCategory) },
      { status: 400 }
    );
  }

  // Technicians can only see work orders assigned to them.
  const technicianIdFilter = isTechnicianScoped(auth.session)
    ? auth.session.user.technician_id
    : (searchParams.get("technician_id") ?? undefined);

  try {
    const workOrders = await listWorkOrders({
      tenant_id:     tenantId,
      status:        rawStatus as WorkOrderStatus | undefined,
      category:      rawCategory,
      technician_id: technicianIdFilter,
    });
    return NextResponse.json({ data: workOrders, total: workOrders.length });
  } catch (err) {
    console.error("[api] GET /api/work-orders failed:", err);
    return NextResponse.json({ error: "Failed to load work orders" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/work-orders
//
// TECHNICIAN: blocked (canCreateWorkOrders: false).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requirePermission("canCreateWorkOrders");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = NewWorkOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const created = await createWorkOrder(result.data, tenantId);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("[api] POST /api/work-orders failed:", err);
    return NextResponse.json({ error: "Failed to create work order" }, { status: 500 });
  }
}
