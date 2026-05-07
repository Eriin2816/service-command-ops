import { type NextRequest, NextResponse } from "next/server";
import { PatchVisitSchema } from "@/lib/validation/visit";
import { getVisitById, updateVisit } from "@/lib/db/queries/visits";
import { WorkOrderStatus, EstimateHandoffStatus } from "@/types/work-order";
import { updateWorkOrder } from "@/lib/db/queries/work-orders";
import { syncEstimateToGhl } from "@/lib/ghl/sync-estimate";
import { requireApiAuth, isTechnicianScoped, getTenantId } from "@/lib/auth/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/visits/[id]
//
// TECHNICIAN: allowed only if the visit belongs to them (technician_id match).
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  let visit;
  try {
    visit = await getVisitById(id, tenantId);
  } catch (err) {
    console.error("[api] GET /api/visits/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load visit" }, { status: 500 });
  }
  if (!visit) {
    return NextResponse.json({ error: `Visit "${id}" not found` }, { status: 404 });
  }

  if (isTechnicianScoped(auth.session) && visit.technician_id !== auth.session.user.technician_id) {
    return NextResponse.json({ error: `Visit "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: visit });
}

// ---------------------------------------------------------------------------
// PATCH /api/visits/[id]
//
// TECHNICIAN: allowed only for their own visits (checklist, notes, estimate flag).
// All store mutations receive tenantId for defense-in-depth.
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  let existingVisit;
  try {
    existingVisit = await getVisitById(id, tenantId);
  } catch (err) {
    console.error("[api] PATCH /api/visits/[id] pre-check failed:", err);
    return NextResponse.json({ error: "Failed to load visit" }, { status: 500 });
  }
  if (!existingVisit) {
    return NextResponse.json({ error: `Visit "${id}" not found` }, { status: 404 });
  }

  if (isTechnicianScoped(auth.session) && existingVisit.technician_id !== auth.session.user.technician_id) {
    return NextResponse.json({ error: `Visit "${id}" not found` }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = PatchVisitSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  let updateResult;
  try {
    updateResult = await updateVisit(id, result.data, tenantId);
  } catch (err) {
    console.error("[api] PATCH /api/visits/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update visit" }, { status: 500 });
  }
  if (!updateResult.ok) {
    return NextResponse.json({ error: `Visit "${id}" not found` }, { status: 404 });
  }

  const updatedVisit = updateResult.data;

  // Detect estimate_flagged transition: false → true.
  const estimateFlaggedNow =
    !existingVisit.estimate_flagged && updatedVisit.estimate_flagged;

  if (estimateFlaggedNow) {
    // Pass tenantId so the work order update is tenant-scoped at the store level.
    void updateWorkOrder(
      updatedVisit.work_order_id,
      {
        status: WorkOrderStatus.ESTIMATE_NEEDED,
        estimate_handoff_status: EstimateHandoffStatus.FLAGGED,
      },
      tenantId
    );
    void syncEstimateToGhl(updatedVisit);
  }

  return NextResponse.json({ data: updatedVisit });
}
