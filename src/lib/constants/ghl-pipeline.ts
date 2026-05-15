// Confirmed pipeline stages for Showtime Pool Service — 2026-05-15.
// These are the exact stage name strings sent by GHL in webhook payloads.
// All comparisons are case-insensitive (see work-order-factory.ts).

export const GHL_PIPELINE_STAGES = {
  NEW_LEAD:             'New Lead',
  DIAGNOSIS_BOOKED:     'Diagnosis Booked',
  DIAGNOSIS_COMPLETED:  'Diagnosis Completed',
  ESTIMATE_SENT:        'Estimate Sent',
  REVIEW_ESTIMATE:      'Review Estimate',
  ESTIMATE_APPROVED:    'Estimate Approved',
  INVOICE_SENT:         'Invoice Sent',
  INVOICE_PAID:         'Invoice Paid',
  IN_PROGRESS:          'In Progress',
  COMPLETED_WON:        'Completed/Won',
} as const;

export type GHLPipelineStageName = typeof GHL_PIPELINE_STAGES[keyof typeof GHL_PIPELINE_STAGES];

// Stages that create a new work order in ServiceOps.
export const STAGES_THAT_CREATE_WORK_ORDER: readonly string[] = [
  GHL_PIPELINE_STAGES.DIAGNOSIS_BOOKED,
  GHL_PIPELINE_STAGES.ESTIMATE_APPROVED,
];

// Stages that update the status of an existing open work order.
// Key = exact stage name (matched case-insensitively), value = WorkOrderStatus string.
export const STAGES_THAT_UPDATE_STATUS: Record<string, string> = {
  [GHL_PIPELINE_STAGES.DIAGNOSIS_COMPLETED]: 'completed',
  [GHL_PIPELINE_STAGES.IN_PROGRESS]:         'in_progress',
  [GHL_PIPELINE_STAGES.COMPLETED_WON]:       'completed',
};

// Stages that trigger an estimate handoff status update.
export const STAGES_THAT_FLAG_ESTIMATE: readonly string[] = [
  GHL_PIPELINE_STAGES.ESTIMATE_SENT,
];

// Env-based override for other clients (comma-separated stage names).
// Falls back to all known stage names if not set.
export const JOB_READY_STAGES: string[] =
  process.env.GHL_JOB_READY_STAGES
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ??
  Object.values(GHL_PIPELINE_STAGES);
