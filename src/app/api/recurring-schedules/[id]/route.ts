import { type NextRequest, NextResponse } from "next/server";
import { requirePermission, getTenantId } from "@/lib/auth/api-auth";
import {
  updateRecurringSchedule,
  deleteRecurringSchedule,
} from "@/lib/db/queries/recurring-schedules";
import { UpdateRecurringScheduleSchema } from "@/lib/validation/recurring-schedule";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// PATCH /api/recurring-schedules/[id]
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermission("canAssignTechnicians");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = UpdateRecurringScheduleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const updated = await updateRecurringSchedule(id, result.data, tenantId);
    if (!updated) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[api] PATCH /api/recurring-schedules/[id]:", err);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/recurring-schedules/[id]
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission("canAssignTechnicians");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  try {
    const deleted = await deleteRecurringSchedule(id, tenantId);
    if (!deleted) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api] DELETE /api/recurring-schedules/[id]:", err);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
