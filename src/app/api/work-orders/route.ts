import { type NextRequest, NextResponse } from "next/server";
import { WorkOrderStatus, ServiceCategory } from "@/types/work-order";
import { NewWorkOrderSchema } from "@/lib/validation/work-order";
import { listWorkOrders, createWorkOrder } from "@/lib/mock-data/store";

// ---------------------------------------------------------------------------
// GET /api/work-orders
// Query params:
//   status     — filter by WorkOrderStatus enum value
//   category   — filter by ServiceCategory enum value
//   tenant_id  — placeholder; production will derive from session
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawStatus = searchParams.get("status") ?? undefined;
  const rawCategory = searchParams.get("category") ?? undefined;
  const tenantId = searchParams.get("tenant_id") ?? undefined;

  // Validate status param
  if (rawStatus !== undefined && !Object.values(WorkOrderStatus).includes(rawStatus as WorkOrderStatus)) {
    return NextResponse.json(
      { error: `Invalid status value: "${rawStatus}"`, allowed: Object.values(WorkOrderStatus) },
      { status: 400 }
    );
  }

  // Validate category param
  if (rawCategory !== undefined && !Object.values(ServiceCategory).includes(rawCategory as ServiceCategory)) {
    return NextResponse.json(
      { error: `Invalid category value: "${rawCategory}"`, allowed: Object.values(ServiceCategory) },
      { status: 400 }
    );
  }

  const workOrders = listWorkOrders({
    tenant_id: tenantId,
    status: rawStatus as WorkOrderStatus | undefined,
    category: rawCategory,
  });

  return NextResponse.json({ data: workOrders, total: workOrders.length });
}

// ---------------------------------------------------------------------------
// POST /api/work-orders
// Body: NewWorkOrderInput (validated via Zod)
// tenant_id is taken from session in production; hardcoded for mock phase.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = NewWorkOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const created = createWorkOrder(result.data);
  return NextResponse.json({ data: created }, { status: 201 });
}
