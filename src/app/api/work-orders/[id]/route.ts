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

  let workOrder;
  try {
    workOrder = await getWorkOrderById(id, tenantId);
  } catch (err) {
    console.error("[api] GET /api/work-orders/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load work order" }, { status: 500 });
  }
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

  let workOrder;
  try {
    workOrder = await getWorkOrderById(id, tenantId);
  } catch (err) {
    console.error("[api] PATCH /api/work-orders/[id] pre-check failed:", err);
    return NextResponse.json({ error: "Failed to load work order" }, { status: 500 });
  }
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

  // Extract retry_ghl_sync flag before passing to DB — it's not a DB column.
  const { retry_ghl_sync: retryGhlSync, ...dbPatch } = result.data;

  let updateResult;
  try {
    updateResult = await updateWorkOrder(id, dbPatch, tenantId);
  } catch (err) {
    console.error("[api] PATCH /api/work-orders/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update work order" }, { status: 500 });
  }

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

  // Trigger GHL sync when status transitions to COMPLETED, or when the
  // client explicitly requests a retry (retry_ghl_sync: true) after a
  // previous sync failure. Use pre-update workOrder.ghl_sync_failed to
  // decide — the DB record may have cleared it during the update.
  const shouldSync =
    updatedWo.status === WorkOrderStatus.COMPLETED ||
    (retryGhlSync === true && workOrder.ghl_sync_failed === true);

  if (shouldSync) {
    const syncPromise = syncCompletionToGhl(updatedWo).catch(console.error);
    // waitUntil keeps the sync alive past the HTTP response in serverless
    // environments (Vercel Edge / Next.js). Falls back to fire-and-forget.
    if (typeof (globalThis as Record<string, unknown>).waitUntil === "function") {
      (globalThis as unknown as { waitUntil: (p: Promise<unknown>) => void }).waitUntil(syncPromise);
    }
    // syncPromise is already floating — no else needed.
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

  let workOrder;
  try {
    workOrder = await getWorkOrderById(id, tenantId);
  } catch (err) {
    console.error("[api] DELETE /api/work-orders/[id] pre-check failed:", err);
    return NextResponse.json({ error: "Failed to load work order" }, { status: 500 });
  }
  if (!workOrder) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }

  let deleted;
  try {
    deleted = await deleteWorkOrder(id, tenantId);
  } catch (err) {
    console.error("[api] DELETE /api/work-orders/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete work order" }, { status: 500 });
  }
  if (!deleted) {
    return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
  }
  return NextResponse.json({ data: { id, deleted: true } });
}
