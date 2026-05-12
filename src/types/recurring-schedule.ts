// Recurring Schedule Types

import { ServiceCategory } from "@/types/work-order";

export enum ScheduleFrequency {
  WEEKLY    = "weekly",
  BIWEEKLY  = "biweekly",
  MONTHLY   = "monthly",
}

export const FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  [ScheduleFrequency.WEEKLY]:   "Weekly",
  [ScheduleFrequency.BIWEEKLY]: "Every 2 Weeks",
  [ScheduleFrequency.MONTHLY]:  "Monthly",
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export interface RecurringSchedule {
  id:               string;
  tenant_id:        string;
  property_id:      string;
  technician_id?:   string;
  frequency:        ScheduleFrequency;
  day_of_week:      number;  // 0 = Sunday … 6 = Saturday
  time_start?:      string;  // "HH:MM"
  time_end?:        string;  // "HH:MM"
  service_category: ServiceCategory;
  is_active:        boolean;
  starts_on:        string;  // "YYYY-MM-DD"
  ends_on?:         string;  // "YYYY-MM-DD" or null
  created_at:       string;
  updated_at:       string;
}

export interface RecurringScheduleWithRelations extends RecurringSchedule {
  technician_name?: string;
  property_address: string;
  property_customer_name: string;
}

export type CreateRecurringScheduleInput = Omit<RecurringSchedule, "id" | "created_at" | "updated_at">;
export type UpdateRecurringScheduleInput = Partial<
  Omit<RecurringSchedule, "id" | "tenant_id" | "property_id" | "created_at" | "updated_at">
>;
