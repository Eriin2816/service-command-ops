import { z } from "zod";
import { SanitizerType, PumpSpeedType, FilterType, HeaterType, PoolShape } from "@/types/property";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Optional string that coerces empty strings to undefined (tolerates HTML form sends)
function optStr(maxLen: number) {
  return z
    .string()
    .max(maxLen)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v));
}

// Optional date string (YYYY-MM-DD) with same empty-string coercion
const optDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

// ---------------------------------------------------------------------------
// Equipment sub-schemas
// ---------------------------------------------------------------------------

const EquipmentItemSchema = z.object({
  make:          optStr(100),
  model:         optStr(100),
  serial_number: optStr(100),
  install_date:  optDate,
  notes:         optStr(1000),
});

const PoolPumpSchema = EquipmentItemSchema.extend({
  type: z.nativeEnum(PumpSpeedType).optional(),
  hp:   z.number().min(0).max(20).optional(),
});

const PoolFilterSchema = EquipmentItemSchema.extend({
  type:       z.nativeEnum(FilterType).optional(),
  size_sq_ft: z.number().min(0).max(10000).optional(),
});

const PoolHeaterSchema = EquipmentItemSchema.extend({
  type:       z.nativeEnum(HeaterType).optional(),
  btu_output: z.number().int().min(0).optional(),
});

const SanitizerSystemSchema = EquipmentItemSchema.extend({
  type: z.nativeEnum(SanitizerType).optional(),
});

// Automation has no additional fields beyond EquipmentItem
const AutomationSystemSchema = EquipmentItemSchema;

const PoolEquipmentSchema = z.object({
  pool_size_gallons: z.number().int().min(1000).max(500000).optional(),
  pool_shape:        z.nativeEnum(PoolShape).optional(),
  pump:              PoolPumpSchema.optional(),
  filter:            PoolFilterSchema.optional(),
  heater:            PoolHeaterSchema.optional(),
  sanitizer:         SanitizerSystemSchema.optional(),
  automation:        AutomationSystemSchema.optional(),
  additional_notes:  optStr(2000),
  last_updated:      z.string().optional(),
});

// ---------------------------------------------------------------------------
// CreatePropertySchema
// Used by POST /api/properties.
// tenant_id is injected server-side — never accepted from the request body.
// ---------------------------------------------------------------------------

export const CreatePropertySchema = z.object({
  customer_name: z
    .string()
    .min(1, "Customer name is required")
    .max(120, "Customer name must be 120 characters or less")
    .transform((v) => v.trim()),

  address_line1: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or less")
    .transform((v) => v.trim()),

  address_line2: optStr(100),

  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less")
    .transform((v) => v.trim()),

  state: z
    .string()
    .min(2, "State must be a 2-letter abbreviation")
    .max(2, "State must be a 2-letter abbreviation")
    .transform((v) => v.toUpperCase()),

  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code — use 5 digits or ZIP+4"),

  ghl_contact_id: optStr(100),
  gate_code:      optStr(20),
  access_notes:   optStr(1000),
  service_notes:  optStr(2000),

  pool_equipment: PoolEquipmentSchema.optional(),

  is_active: z.boolean().default(true),
});

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;

// ---------------------------------------------------------------------------
// PatchPropertySchema
// Used by PATCH /api/properties/[id].
// All fields optional. tenant_id is immutable — never accepted in a patch.
// ---------------------------------------------------------------------------

export const PatchPropertySchema = z.object({
  customer_name: z
    .string()
    .min(1, "Customer name is required")
    .max(120, "Customer name must be 120 characters or less")
    .transform((v) => v.trim())
    .optional(),

  address_line1: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or less")
    .transform((v) => v.trim())
    .optional(),

  address_line2: optStr(100),

  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less")
    .transform((v) => v.trim())
    .optional(),

  state: z
    .string()
    .min(2, "State must be a 2-letter abbreviation")
    .max(2, "State must be a 2-letter abbreviation")
    .transform((v) => v.toUpperCase())
    .optional(),

  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code — use 5 digits or ZIP+4")
    .optional(),

  ghl_contact_id: optStr(100),
  gate_code:      optStr(20),
  access_notes:   optStr(1000),
  service_notes:  optStr(2000),

  pool_equipment: PoolEquipmentSchema.optional(),

  is_active: z.boolean().optional(),
});

export type PatchPropertyInput = z.infer<typeof PatchPropertySchema>;
