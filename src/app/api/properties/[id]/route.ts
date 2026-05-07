import { type NextRequest, NextResponse } from "next/server";
import { PatchPropertySchema } from "@/lib/validation/property";
import { getPropertyById, updateProperty } from "@/lib/db/queries/properties";
import { requirePermission, getTenantId } from "@/lib/auth/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/properties/[id]
//
// TECHNICIAN: blocked (canViewAllProperties: false).
// tenant_id is derived from session — never from route params.
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requirePermission("canViewAllProperties");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  let property;
  try {
    property = await getPropertyById(id, tenantId);
  } catch (err) {
    console.error("[api] GET /api/properties/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load property" }, { status: 500 });
  }
  if (!property) {
    return NextResponse.json({ error: `Property "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: property });
}

// ---------------------------------------------------------------------------
// PATCH /api/properties/[id]
//
// TECHNICIAN / READ_ONLY_OWNER: blocked (canEditProperties: false).
// tenant_id is derived from session and passed to all store calls.
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requirePermission("canEditProperties");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { id } = await params;

  try {
    if (!await getPropertyById(id, tenantId)) {
      return NextResponse.json({ error: `Property "${id}" not found` }, { status: 404 });
    }
  } catch (err) {
    console.error("[api] PATCH /api/properties/[id] pre-check failed:", err);
    return NextResponse.json({ error: "Failed to load property" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = PatchPropertySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  let updateResult;
  try {
    updateResult = await updateProperty(id, result.data, tenantId);
  } catch (err) {
    console.error("[api] PATCH /api/properties/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }

  if (!updateResult.ok) {
    return NextResponse.json({ error: `Property "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: updateResult.data });
}
