/**
 * Server-only barrel — safe to import from API routes and server components.
 * Do NOT import this in client components; use ./browser.ts instead.
 */
export { db } from "./client";
export type { Database } from "./types";
export type {
  TenantRow,
  UserRow,
  PropertyRow,
  WorkOrderRow,
  VisitRow,
  ChecklistItemRow,
  ChecklistItemJson,
  TechnicianNoteRow,
  PhotoRow,
  EstimateHandoffRow,
  DbUserRole,
  DbWorkOrderStatus,
  DbPriority,
  DbServiceCategory,
  DbEstimateHandoffStatus,
  DbVisitStatus,
} from "./types";
