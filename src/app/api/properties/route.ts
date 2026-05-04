import { type NextRequest, NextResponse } from "next/server";
import { CreatePropertySchema } from "@/lib/validation/property";
import { listProperties, createProperty } from "@/lib/mock-data/property-store";

// ---------------------------------------------------------------------------
// GET /api/properties
// Query params:
//   is_active  — "true" | "false" — filter by active status
//   tenant_id  — placeholder; production will derive from session
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawIsActive = searchParams.get("is_active") ?? undefined;
  const tenantId    = searchParams.get("tenant_id") ?? undefined;

  // Validate is_active param
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

  const properties = listProperties({ tenant_id: tenantId, is_active: isActiveFilter });

  return NextResponse.json({ data: properties, total: properties.length });
}

// ---------------------------------------------------------------------------
// POST /api/properties
// Body: CreatePropertyInput (validated via Zod)
// tenant_id is taken from session in production; hardcoded for mock phase.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
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

  const created = createProperty(result.data);
  return NextResponse.json({ data: created }, { status: 201 });
}
