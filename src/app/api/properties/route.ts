import { type NextRequest, NextResponse } from "next/server";
import { CreatePropertySchema } from "@/lib/validation/property";
import { listProperties, createProperty } from "@/lib/db/queries/properties";
import { requirePermission, getTenantId } from "@/lib/auth/api-auth";

// ---------------------------------------------------------------------------
// GET /api/properties
//
// TECHNICIAN: blocked (canViewAllProperties: false).
// READ_ONLY_OWNER: allowed.
//
// Query params:
//   is_active — "true" | "false"
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await requirePermission("canViewAllProperties");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  const { searchParams } = request.nextUrl;
  const rawIsActive = searchParams.get("is_active") ?? undefined;

  let isActiveFilter: boolean | undefined;
  if (rawIsActive !== undefined) {
    if (rawIsActive === "true") {
      isActiveFilter = true;
    } else if (rawIsActive === "false") {
      isActiveFilter = false;
    } else {
      return NextResponse.json(
        { error: `Invalid is_active value: "${rawIsActive}" — must be "true" or "false"` },
        { status: 400 }
      );
    }
  }

  try {
    const properties = await listProperties({ tenant_id: tenantId, is_active: isActiveFilter });
    return NextResponse.json({ data: properties, total: properties.length });
  } catch (err) {
    console.error("[api] GET /api/properties failed:", err);
    // Return empty list so the table renders an empty state rather than an error banner.
    return NextResponse.json({ data: [], total: 0 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/properties
//
// TECHNICIAN / READ_ONLY_OWNER: blocked (canEditProperties: false).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requirePermission("canEditProperties");
  if (!auth.ok) return auth.response;
  const tenantId = getTenantId(auth.session);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = CreatePropertySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const created = await createProperty(result.data, tenantId);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("[api] POST /api/properties failed:", err);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
