/**
 * Server-only — generates recurring work orders and visits for active schedules.
 * Idempotent: checks for existing work orders before creating.
 */

import { db } from "@/lib/db/client";
import { ScheduleFrequency } from "@/types/recurring-schedule";
import { WorkOrderStatus, Priority, ServiceCategory } from "@/types/work-order";
import { VisitStatus } from "@/types/visit";
import { listRecurringSchedules } from "@/lib/db/queries/recurring-schedules";
import { checklistTemplates } from "@/config/checklist-templates";
import type { RecurringScheduleWithRelations } from "@/types/recurring-schedule";
import type { ChecklistItem } from "@/types/visit";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.WEEKLY_POOL_MAINTENANCE]:    "Weekly Pool Maintenance",
  [ServiceCategory.POOL_REPAIR]:                "Pool Repair",
  [ServiceCategory.POOL_INSPECTION_DIAGNOSTIC]: "Pool Inspection",
  [ServiceCategory.FILTER_CLEANING]:            "Filter Cleaning",
  [ServiceCategory.HEATER_SERVICE]:             "Heater Service",
  [ServiceCategory.EQUIPMENT_INSTALLATION]:     "Equipment Installation",
  [ServiceCategory.POOL_REMODEL]:               "Pool Remodel",
  [ServiceCategory.NEW_CONSTRUCTION]:           "New Construction",
  [ServiceCategory.EMERGENCY_SERVICE]:          "Emergency Service",
  [ServiceCategory.OTHER]:                      "Service Visit",
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns all target dates for a schedule within [windowStart, windowEnd]. */
function computeTargetDates(
  schedule: RecurringScheduleWithRelations,
  windowStart: Date,
  windowEnd: Date
): string[] {
  const startsOn = new Date(schedule.starts_on + "T00:00:00");
  const endsOn   = schedule.ends_on ? new Date(schedule.ends_on + "T23:59:59") : null;

  const dates: string[] = [];
  const cursor = new Date(Math.max(windowStart.getTime(), startsOn.getTime()));

  // Advance cursor to the first occurrence of day_of_week on or after cursor
  const targetDay = schedule.day_of_week;
  const daysUntilTarget = (targetDay - cursor.getDay() + 7) % 7;
  cursor.setDate(cursor.getDate() + daysUntilTarget);

  if (schedule.frequency === ScheduleFrequency.BIWEEKLY) {
    // Align to the schedule's starts_on week parity
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const refDay = new Date(startsOn);
    const refDayAdj = (targetDay - refDay.getDay() + 7) % 7;
    refDay.setDate(refDay.getDate() + refDayAdj);

    const weeksDiff = Math.round((cursor.getTime() - refDay.getTime()) / msPerWeek);
    if (weeksDiff % 2 !== 0) {
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  const step = schedule.frequency === ScheduleFrequency.MONTHLY ? null : (
    schedule.frequency === ScheduleFrequency.BIWEEKLY ? 14 : 7
  );

  if (schedule.frequency === ScheduleFrequency.MONTHLY) {
    // Monthly: same day-of-month as starts_on, on or after cursor
    const dayOfMonth = startsOn.getDate();
    let year  = cursor.getFullYear();
    let month = cursor.getMonth();

    while (true) {
      const candidate = new Date(year, month, dayOfMonth);
      if (candidate > windowEnd) break;
      if (endsOn && candidate > endsOn) break;
      if (candidate >= windowStart && candidate.getDay() === targetDay) {
        dates.push(toDateStr(candidate));
      } else if (candidate >= windowStart) {
        // Use the day-of-month regardless of day_of_week for monthly
        dates.push(toDateStr(candidate));
      }
      month++;
      if (month > 11) { month = 0; year++; }
    }
  } else {
    // Weekly or biweekly — step forward by fixed interval
    while (cursor <= windowEnd) {
      if (!endsOn || cursor <= endsOn) {
        dates.push(toDateStr(cursor));
      }
      cursor.setDate(cursor.getDate() + step!);
    }
  }

  return dates;
}

// ---------------------------------------------------------------------------
// buildChecklist
// ---------------------------------------------------------------------------

function buildChecklist(category: ServiceCategory): ChecklistItem[] {
  const template = checklistTemplates.find((t) => t.serviceCategory === category);
  if (!template) return [];
  return template.items.map((label) => ({
    id: crypto.randomUUID(),
    label,
    completed: false,
  }));
}

// ---------------------------------------------------------------------------
// generateVisitsForSchedule
// ---------------------------------------------------------------------------

export async function generateVisitsForSchedule(
  schedule: RecurringScheduleWithRelations,
  weeksAhead = 4
): Promise<{ created: number; skipped: number }> {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + weeksAhead * 7);

  const targetDates = computeTargetDates(schedule, today, windowEnd);
  let created = 0;
  let skipped = 0;

  for (const dateStr of targetDates) {
    // Idempotency check: skip if a WO already exists for this schedule+date
    const { data: existing } = await db
      .from("work_orders")
      .select("id")
      .eq("recurring_schedule_id", schedule.id)
      .eq("scheduled_date", dateStr)
      .eq("tenant_id", schedule.tenant_id)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const title = `${CATEGORY_LABELS[schedule.service_category]} — ${schedule.property_customer_name}`;
    const checklist = buildChecklist(schedule.service_category);

    // Create work order
    const { data: wo, error: woError } = await db
      .from("work_orders")
      .insert({
        tenant_id:              schedule.tenant_id,
        property_id:            schedule.property_id,
        title,
        status:                 WorkOrderStatus.ASSIGNED,
        priority:               Priority.NORMAL,
        service_category:       schedule.service_category,
        assigned_technician_id: schedule.technician_id ?? null,
        scheduled_date:         dateStr,
        scheduled_time_start:   schedule.time_start ?? null,
        scheduled_time_end:     schedule.time_end ?? null,
        estimate_handoff_status: "not_needed",
        ghl_sync_failed:        false,
        recurring_schedule_id:  schedule.id,
      })
      .select("id")
      .single();

    if (woError || !wo) {
      console.error(`[scheduling] Failed to create WO for schedule ${schedule.id} on ${dateStr}:`, woError?.message);
      continue;
    }

    // Create visit
    const { error: visitError } = await db
      .from("visits")
      .insert({
        tenant_id:        schedule.tenant_id,
        work_order_id:    wo.id,
        property_id:      schedule.property_id,
        technician_id:    schedule.technician_id ?? null,
        status:           VisitStatus.SCHEDULED,
        scheduled_date:   dateStr,
        checklist:        checklist as unknown as Record<string, unknown>[],
        photo_urls:       [],
        estimate_flagged: false,
      });

    if (visitError) {
      console.error(`[scheduling] Failed to create visit for WO ${wo.id}:`, visitError.message);
    }

    created++;
  }

  return { created, skipped };
}

// ---------------------------------------------------------------------------
// generateAllActiveVisits — runs across all active schedules for a tenant
// ---------------------------------------------------------------------------

export async function generateAllActiveVisits(
  tenantId: string,
  weeksAhead = 4
): Promise<{ created: number; skipped: number; schedules: number }> {
  const schedules = await listRecurringSchedules({ tenant_id: tenantId, is_active: true });

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const schedule of schedules) {
    const result = await generateVisitsForSchedule(schedule, weeksAhead);
    totalCreated += result.created;
    totalSkipped += result.skipped;
  }

  return { created: totalCreated, skipped: totalSkipped, schedules: schedules.length };
}
