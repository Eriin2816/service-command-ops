import { z } from "zod";
import { ScheduleFrequency } from "@/types/recurring-schedule";
import { ServiceCategory } from "@/types/work-order";

export const CreateRecurringScheduleSchema = z.object({
  property_id: z.string().uuid("Invalid property ID"),

  technician_id: z
    .string()
    .uuid("Invalid technician ID")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  frequency: z.nativeEnum(ScheduleFrequency, { message: "Invalid frequency" }),

  day_of_week: z
    .number()
    .int()
    .min(0)
    .max(6, "Day of week must be 0–6"),

  time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  service_category: z.nativeEnum(ServiceCategory, { message: "Invalid service category" }),

  is_active: z.boolean().default(true),

  starts_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),

  ends_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateRecurringScheduleInput = z.infer<typeof CreateRecurringScheduleSchema>;

export const UpdateRecurringScheduleSchema = CreateRecurringScheduleSchema
  .omit({ property_id: true })
  .partial();

export type UpdateRecurringScheduleInput = z.infer<typeof UpdateRecurringScheduleSchema>;
