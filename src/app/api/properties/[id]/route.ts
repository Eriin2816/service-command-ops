import { type NextRequest, NextResponse } from "next/server";
import { PatchPropertySchema } from "@/lib/validation/property";
import {
  getPropertyById,
  updateProperty,
} from "@/lib/mock-data/property-store";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/properties/[id]
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const property = getPropertyById(id);
  if (!property) {
    return NextResponse.json({ error: `Property "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: property });
}

// ---------------------------------------------------------------------------
// PATCH /api/properties/[id]
// Supports partial updates of any mutable property field including
// pool_equipment, access notes, service notes, and is_active (soft delete).
// tenant_id and id are immutable — ignored if included in the body.
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!getPropertyById(id)) {
    return NextResponse.json({ error: `Property "${id}" not found` }, { status: 404 });
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

  const updateResult = updateProperty(id, result.data);

  if (!updateResult.ok) {
    return NextResponse.json({ error: `Property "${id}" not found` }, { status: 404 });
  }

  return NextResponse.json({ data: updateResult.data });
}
