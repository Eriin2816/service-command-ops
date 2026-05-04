// GHL Webhook Intake — Placeholder
// Implement in Phase 5

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: Verify GHL webhook signature
  // TODO: Parse payload
  // TODO: Create work order from GHL data
  return NextResponse.json({ status: "placeholder" }, { status: 200 });
}
