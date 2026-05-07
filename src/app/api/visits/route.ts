import { type NextRequest, NextResponse } from "next/server";
import { CreateVisitSchema } from "@/lib/validation/visit";
import { listVisits, createVisit } from "@/lib/db/queries/visits";
import { VisitStatus } from "@/types/visit";
import { requireApiAuth, isTechnicianScoped, getTenantId } from "@/lib/auth/api-auth";

// ---------------------------------------------------------------------------
// GET /api/visits
//
// TENANT_ADMIN / OFFICE_STAFF: full list, all filters available.
// TECHNICIAN: automatically scoped to their technician_id.
//
// Query params:
//   work_order_id    — filter by work order
//   property_id      — filter by property
//   technician_id    — filter by assigned tech (ignored/overridden for TECHNICIAN role)
//   status           — VisitStatus enum value
//   estimate_flagged — "true" | "false"
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { searchParams } = request.nextUrl;

  const workOrderId = searchParams.get("work_order_id") ?? undefined;
  const propertyId  = searchParams.get("property_id")   ?? undefined;
  const rawStatus   = searchParams.get("status")        ?? undefined;
  const rawEstimate = searchParams.get("estimate_flagged") ?? undefined;

  if (rawStatus !== undefined) {
    if (!Object.values(VisitStatus).includes(rawStatus as VisitStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status value: "${rawStatus}" — must be one of: ${Object.values(VisitStatus).join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  let estimateFlaggedFilter: boolean | undefined;
  if (rawEstimate !== undefined) {
    if (rawEstimate === "true") {
      estimateFlaggedFilter = true;
    } else if (rawEstimate === "false") {
      estimateFlaggedFilter = false;
    } else {
      return NextResponse.json(
        { error: `Invalid estimate_flagged value: "${rawEstimate}" — must be "true" or "false"` },
        { status: 400 }
      );
    }
  }

  // Technicians can only list their own visits.
  const technicianIdFilter = isTechnicianScoped(auth.session)
    ? auth.session.user.technician_id
    : (searchParams.get("technician_id") ?? undefined);

  const visits = await listVisits({
    tenant_id:        tenantId,
    work_order_id:    workOrderId,
    property_id:      propertyId,
    technician_id:    technicianIdFilter,
    status:           rawStatus as VisitStatus | undefined,
    estimate_flagged: estimateFlaggedFilter,
  });

  return NextResponse.json({ data: visits, total: visits.length });
}

// ---------------------------------------------------------------------------
// POST /api/visits
//
// All authenticated roles allowed — technicians create visits via mobile flow.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = CreateVisitSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const created = await createVisit(result.data, tenantId);
  return NextResponse.json({ data: created }, { status: 201 });
}
