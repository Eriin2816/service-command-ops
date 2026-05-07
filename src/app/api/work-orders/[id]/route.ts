import { type NextRequest, NextResponse } from "next/server";
import { PatchWorkOrderSchema } from "@/lib/validation/work-order";
import {
  getWorkOrderById,
  updateWorkOrder,
  deleteWorkOrder,
} from "@/lib/db/queries/work-orders";
import { WorkOrderStatus } from "@/types/work-order";
import { syncCompletionToGhl } from "@/lib/ghl/sync-completion";
import { requireApiAuth, requirePermission, isTechnicianScoped, getTenantId } from "@/lib/auth/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/work-orders/[id]
//
// TECHNICIAN: allowed only if the work order is assigned to them.
// Post-fetch tenant check ensures cross-tenant ID guessing returns 404.
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  const workOrder = await getWorkOrderById(id, tenantId);
  if (!workOrder) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }

  if (
    isTechnicianScoped(auth.session) &&
    workOrder.assigned_technician_id !== auth.session.user.technician_id
  ) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: workOrder });
}

// ---------------------------------------------------------------------------
// PATCH /api/work-orders/[id]
//
// TECHNICIAN: blocked (canViewAllWorkOrders: false for write access).
// tenantId is passed to updateWorkOrder for defense-in-depth.
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requirePermission("canViewAllWorkOrders");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  const workOrder = await getWorkOrderById(id, tenantId);
  if (!workOrder) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = PatchWorkOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updateResult = await updateWorkOrder(id, result.data, tenantId);

  if (!updateResult.ok) {
    if (updateResult.notFound) {
      return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
    }
    const { transitionError } = updateResult;
    return NextResponse.json(
      {
        error: `Invalid status transition: "${transitionError.from}" → "${transitionError.to}"`,
        allowed_transitions: transitionError.allowed,
      },
      { status: 422 }
    );
  }

  const updatedWo = updateResult.data;

  if (updatedWo.status === WorkOrderStatus.COMPLETED) {
    void syncCompletionToGhl(updatedWo);
  }

  return NextResponse.json({ data: updatedWo });
}

// ---------------------------------------------------------------------------
// DELETE /api/work-orders/[id]
//
// TECHNICIAN / READ_ONLY_OWNER: blocked (canCreateWorkOrders: false).
// tenantId is passed to deleteWorkOrder for defense-in-depth.
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requirePermission("canCreateWorkOrders");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  const workOrder = await getWorkOrderById(id, tenantId);
  if (!workOrder) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }

  const deleted = await deleteWorkOrder(id, tenantId);
  if (!deleted) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: { id, deleted: true } });
}
