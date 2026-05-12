import { db } from "@/lib/db/client";
import { EstimateHandoffStatus } from "@/types/work-order";

// ---------------------------------------------------------------------------
// createEstimateHandoff
// Called when a technician flags estimate_needed on a visit.
// UNIQUE (work_order_id) — safe to call multiple times on the same WO;
// subsequent calls upsert so the visit_id + flagged_by are refreshed.
// ---------------------------------------------------------------------------

export async function createEstimateHandoff(input: {
  tenant_id: string;
  work_order_id: string;
  visit_id: string;
  flagged_by_technician_id?: string;
}): Promise<{ id: string }> {
  const { data, error } = await db
    .from("estimate_handoffs")
    .upsert(
      {
        tenant_id:                input.tenant_id,
        work_order_id:            input.work_order_id,
        visit_id:                 input.visit_id,
        flagged_by_technician_id: input.flagged_by_technician_id ?? null,
        status:                   EstimateHandoffStatus.FLAGGED,
        flagged_at:               new Date().toISOString(),
      },
      { onConflict: "work_order_id" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`[db] createEstimateHandoff: ${error.message}`);
  return { id: (data as { id: string }).id };
}

// ---------------------------------------------------------------------------
// markEstimateHandoffSentToGHL
// Called by sync-estimate.ts after a GHL task is successfully created.
// ---------------------------------------------------------------------------

export async function markEstimateHandoffSentToGHL(
  workOrderId: string,
  tenantId: string,
  ghlTaskId: string
): Promise<void> {
  const { error } = await db
    .from("estimate_handoffs")
    .update({
      status:        EstimateHandoffStatus.SENT_TO_GHL,
      ghl_task_id:   ghlTaskId,
      sent_to_ghl_at: new Date().toISOString(),
    })
    .eq("work_order_id", workOrderId)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error(`[db] markEstimateHandoffSentToGHL: ${error.message}`);
  }
}
