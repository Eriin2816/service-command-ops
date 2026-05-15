import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type {
  GHLWebhookPayload,
  GHLOpportunityStatusChangePayload,
} from "@/types/ghl";
import { upsertPropertyFromGHL } from "@/lib/ghl/upsert-property-from-ghl";
import { createWorkOrderFromAppointment } from "@/lib/ghl/create-work-order-from-appointment";
import {
  createWorkOrderFromGHLStage,
  updateWorkOrderStatusByGHLOpportunity,
  flagEstimateFromGHL,
} from "@/lib/ghl/work-order-factory";
import {
  STAGES_THAT_CREATE_WORK_ORDER,
  STAGES_THAT_UPDATE_STATUS,
  STAGES_THAT_FLAG_ESTIMATE,
} from "@/lib/constants/ghl-pipeline";
import { resolveTenantId } from "@/lib/ghl/tenant-config";

// ---------------------------------------------------------------------------
// Signature verification
// GHL signs the raw request body with HMAC-SHA256 using GHL_WEBHOOK_SECRET.
// The signature is sent in the "x-ghl-signature" header as a hex digest.
// ---------------------------------------------------------------------------

function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  let incomingBuf: Buffer;
  try {
    incomingBuf = Buffer.from(signatureHeader, "hex");
  } catch {
    return false;
  }

  const expectedBuf = Buffer.from(expected, "hex");

  if (incomingBuf.length !== expectedBuf.length) return false;

  try {
    return timingSafeEqual(incomingBuf, expectedBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST /api/ghl/webhooks
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  // ── Signature verification ─────────────────────────────────────────────────
  const secret = process.env.GHL_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[ghl/webhooks] GHL_WEBHOOK_SECRET is not set — rejecting request in production");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    console.warn("[ghl/webhooks] GHL_WEBHOOK_SECRET not set — signature verification skipped (dev mode)");
  } else {
    const signatureHeader = request.headers.get("x-ghl-signature") ?? "";
    if (!verifySignature(rawBody, signatureHeader, secret)) {
      console.warn("[ghl/webhooks] Rejected: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  let payload: GHLWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GHLWebhookPayload;
  } catch {
    console.error("[ghl/webhooks] Failed to parse JSON body");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(
    "[ghl/webhooks] Received event | type=%s locationId=%s",
    payload.type,
    payload.locationId,
  );

  // ── Dispatch ───────────────────────────────────────────────────────────────
  // Fire-and-forget — always return 200 after verification so GHL doesn't retry.
  void dispatch(payload).catch((err) => {
    console.error("[ghl/webhooks] Unhandled dispatch error:", err);
  });

  return NextResponse.json({ received: true }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Event dispatch
// ---------------------------------------------------------------------------

async function dispatch(payload: GHLWebhookPayload): Promise<void> {
  switch (payload.type) {

    case "OpportunityStatusChange": {
      const opp = payload as GHLOpportunityStatusChangePayload;

      // Resolve tenant first — required for all stage handlers
      const tenantId = resolveTenantId(opp.locationId);
      if (!tenantId) {
        console.error(
          `[ghl/webhooks] OpportunityStatusChange — unknown locationId "${opp.locationId}". Discarding.`
        );
        break;
      }

      // Discard terminal non-job statuses
      if (opp.status === "lost" || opp.status === "abandoned") {
        console.log(`[ghl/webhooks] OpportunityStatusChange — status="${opp.status}", discarding.`);
        break;
      }

      const stageName = (opp.pipelineStage?.name ?? "").trim();
      const stageNorm = stageName.toLowerCase();

      // ── CREATE: Diagnosis Booked or Estimate Approved ──────────────────────
      if (STAGES_THAT_CREATE_WORK_ORDER.some((s) => s.toLowerCase() === stageNorm)) {
        const result = await createWorkOrderFromGHLStage(opp, stageName, tenantId);
        switch (result.outcome) {
          case "created":
            console.log(
              `[ghl/webhooks] Stage "${stageName}" → created WO ${result.workOrder.wo_number}`
            );
            break;
          case "already_exists":
            console.log(
              `[ghl/webhooks] Stage "${stageName}" → idempotent, existing WO ${result.workOrder.wo_number}`
            );
            break;
          case "skipped":
            console.log(`[ghl/webhooks] Stage "${stageName}" → skipped: ${result.reason}`);
            break;
          case "error":
            console.error(`[ghl/webhooks] Stage "${stageName}" → error: ${result.reason}`);
            break;
        }
        break;
      }

      // ── UPDATE STATUS: Diagnosis Completed, In Progress, Completed/Won ─────
      const updateStatusValue = Object.entries(STAGES_THAT_UPDATE_STATUS).find(
        ([k]) => k.toLowerCase() === stageNorm
      )?.[1];

      if (updateStatusValue) {
        await updateWorkOrderStatusByGHLOpportunity(opp.id, updateStatusValue, stageName, tenantId);
        break;
      }

      // Fallback: GHL top-level "won" without a matching stage → mark completed
      if (opp.status === "won") {
        await updateWorkOrderStatusByGHLOpportunity(opp.id, "completed", "won", tenantId);
        break;
      }

      // ── FLAG ESTIMATE: Estimate Sent ───────────────────────────────────────
      if (STAGES_THAT_FLAG_ESTIMATE.some((s) => s.toLowerCase() === stageNorm)) {
        await flagEstimateFromGHL(opp.id, tenantId);
        break;
      }

      // All other stages — no action
      console.log(`[ghl/webhooks] Stage "${stageName}" — no action configured`);
      break;
    }

    case "ContactCreate":
    case "ContactUpdate": {
      const result = await upsertPropertyFromGHL(payload);
      switch (result.outcome) {
        case "created":
          console.log(
            `[ghl/webhooks] ${payload.type} → created Property ${result.property.id} (${result.property.customer_name})`
          );
          break;
        case "updated":
          console.log(
            `[ghl/webhooks] ${payload.type} → updated Property ${result.property.id} (${result.property.customer_name})`
          );
          break;
        case "skipped":
          console.log(`[ghl/webhooks] ${payload.type} → skipped: ${result.reason}`);
          break;
        case "error":
          console.error(`[ghl/webhooks] ${payload.type} → error: ${result.reason}`);
          break;
      }
      break;
    }

    case "AppointmentBooked": {
      const result = await createWorkOrderFromAppointment(payload);
      switch (result.outcome) {
        case "created":
          console.log(
            `[ghl/webhooks] AppointmentBooked → created WO ${result.workOrder.wo_number}`
          );
          break;
        case "already_exists":
          console.log(
            `[ghl/webhooks] AppointmentBooked → idempotent, existing WO ${result.workOrder.wo_number}`
          );
          break;
        case "skipped":
          console.log(`[ghl/webhooks] AppointmentBooked → skipped: ${result.reason}`);
          break;
        case "error":
          console.error(`[ghl/webhooks] AppointmentBooked → error: ${result.reason}`);
          break;
      }
      break;
    }

    case "ContactDelete":
    case "ContactTagApplied":
    case "OpportunityCreate":
    case "OpportunityStageUpdate":
    case "OpportunityAssignedToUpdate":
    case "OpportunityMonetaryValueUpdate":
    case "OpportunityDelete":
      break;

    default: {
      const unhandled: never = payload;
      console.warn("[ghl/webhooks] Unknown event type:", (unhandled as GHLWebhookPayload).type);
    }
  }
}
