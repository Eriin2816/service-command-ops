import { type NextRequest, NextResponse } from "next/server";
import { requireApiAuth, requirePermission, getTenantId } from "@/lib/auth/api-auth";
import {
  listRecurringSchedules,
  createRecurringSchedule,
} from "@/lib/db/queries/recurring-schedules";
import { CreateRecurringScheduleSchema } from "@/lib/validation/recurring-schedule";

// ---------------------------------------------------------------------------
// GET /api/recurring-schedules?property_id=...
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("property_id") ?? undefined;

  try {
    const schedules = await listRecurringSchedules({ tenant_id: tenantId, property_id: propertyId });
    return NextResponse.json({ data: schedules });
  } catch (err) {
    console.error("[api] GET /api/recurring-schedules:", err);
    return NextResponse.json({ error: "Failed to load schedules" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/recurring-schedules
// Requires canManageSchedules (TENANT_ADMIN, OFFICE_STAFF)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requirePermission("canAssignTechnicians");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = CreateRecurringScheduleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const schedule = await createRecurringSchedule(result.data, tenantId);
    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (err) {
    console.error("[api] POST /api/recurring-schedules:", err);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}
