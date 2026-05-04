// Property Types

// ---------------------------------------------------------------------------
// Equipment enums
// ---------------------------------------------------------------------------

export enum SanitizerType {
  CHLORINE      = "chlorine",
  SALTWATER     = "saltwater",
  UV            = "uv",
  OZONE         = "ozone",
  MINERAL       = "mineral",
  OTHER         = "other",
}

export enum PumpSpeedType {
  SINGLE_SPEED   = "single_speed",
  DUAL_SPEED     = "dual_speed",
  VARIABLE_SPEED = "variable_speed",
}

export enum FilterType {
  CARTRIDGE = "cartridge",
  DE        = "de",        // diatomaceous earth
  SAND      = "sand",
}

export enum HeaterType {
  GAS                = "gas",
  ELECTRIC_HEAT_PUMP = "electric_heat_pump",
  SOLAR              = "solar",
  NONE               = "none",
}

export enum PoolShape {
  RECTANGLE = "rectangle",
  FREEFORM  = "freeform",
  LAP       = "lap",
  SPORT     = "sport",
  OTHER     = "other",
}

// ---------------------------------------------------------------------------
// Equipment item base — shared fields for every piece of equipment
// ---------------------------------------------------------------------------

export interface EquipmentItem {
  make?: string;
  model?: string;
  serial_number?: string;
  install_date?: string; // YYYY-MM-DD
  notes?: string;
}

// ---------------------------------------------------------------------------
// Specific equipment types
// ---------------------------------------------------------------------------

export interface PoolPump extends EquipmentItem {
  type?: PumpSpeedType;
  hp?: number; // e.g. 1.5, 2.0
}

export interface PoolFilter extends EquipmentItem {
  type?: FilterType;
  size_sq_ft?: number; // filter surface area
}

export interface PoolHeater extends EquipmentItem {
  type?: HeaterType;
  btu_output?: number; // e.g. 400000 for a 400k BTU gas heater
}

export interface SanitizerSystem extends EquipmentItem {
  type?: SanitizerType;
}

export interface AutomationSystem extends EquipmentItem {
  // make/model/serial inherited — e.g. Pentair IntelliCenter, Jandy iAqualink
}

// ---------------------------------------------------------------------------
// PoolEquipment — stored as JSONB on the property record.
// Captures the current state of the pool's equipment, not historical changes.
// Equipment replacement history is tracked in the equipment_records table (Phase 4+).
// ---------------------------------------------------------------------------

export interface PoolEquipment {
  pool_size_gallons?: number;
  pool_shape?: PoolShape;
  pump?: PoolPump;
  filter?: PoolFilter;
  heater?: PoolHeater;
  sanitizer?: SanitizerSystem;
  automation?: AutomationSystem;
  additional_notes?: string; // anything that doesn't fit above
  last_updated?: string;     // ISO datetime — when equipment info was last confirmed on-site
}

// ---------------------------------------------------------------------------
// Property — a customer's service location.
// One GHL contact can have multiple properties (e.g. a customer with two homes).
// ServiceOps owns property data; GHL owns contact/customer data.
// ---------------------------------------------------------------------------

export interface Property {
  id: string;
  tenant_id: string;

  // GHL reference — optional because properties can be created before a GHL link exists.
  // Never store full GHL contact data here; fetch from GHL API when needed.
  ghl_contact_id?: string;

  // Display name — mirrors the GHL contact name at sync time. Not kept in live sync.
  customer_name: string;

  // Address
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;

  // Access — stored separately so technicians can see gate_code at a glance
  gate_code?: string;
  access_notes?: string; // dogs, parking, key location, alarm, etc.

  // Standing service instructions — e.g. "always leave gate latched", "run backwash first"
  service_notes?: string;

  // Pool equipment snapshot (JSONB in DB)
  pool_equipment?: PoolEquipment;

  is_active: boolean;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Enriched type — used in list and detail views
// ---------------------------------------------------------------------------

export interface PropertyWithRelations extends Property {
  active_work_order_count: number;    // WOs in non-terminal statuses
  last_service_date?: string;         // scheduled_date of most recent COMPLETED WO
  last_service_technician_name?: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type CreatePropertyInput = Omit<Property, "id" | "created_at" | "updated_at">;

// tenant_id is immutable after creation — never include in an update
export type UpdatePropertyInput = Partial<
  Omit<Property, "id" | "tenant_id" | "created_at" | "updated_at">
>;
