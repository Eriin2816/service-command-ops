# Feature Spec — Property Profiles

**Status**: Types finalized. Spec approved. UI build pending (Phase 3).
**Last updated**: 2026-05-04
**Author**: Claude Code (session 2026-05-04)

---

## 1. Purpose

A Property Profile is the permanent record for a customer's service location. It answers the questions a technician needs before arriving on-site: where is it, how do I get in, what equipment is there, and what are the standing instructions?

Every work order is linked to exactly one property. Every property belongs to exactly one tenant. A single GHL contact (customer) may have multiple properties (e.g., a customer with two homes).

---

## 2. What ServiceOps Owns vs What GHL Owns

| Data | Owner | Rule |
|------|-------|------|
| Customer name, email, phone, billing address | GHL | Never duplicate in ServiceOps. Display via GHL contact ID. |
| Lead pipeline, opportunities, appointments | GHL | Mirror status only — never manage here. |
| Service location address | ServiceOps | ServiceOps owns the physical address for routing and job dispatch. |
| Pool equipment records | ServiceOps | GHL has no equipment data model. |
| Access notes, gate codes | ServiceOps | Operational field data — not in GHL. |
| Service history (what was done at this address) | ServiceOps | Work orders + visits own this. |
| Photos, checklists, technician notes | ServiceOps | Operational records — not in GHL. |

The link between a Property and a GHL customer is `ghl_contact_id` (a VARCHAR stored on the property). This field is **optional** because:
- Properties can be created manually before a GHL workflow triggers
- A tenant may import legacy properties before GHL is integrated
- GHL is not always the source of a new property record in every workflow

---

## 3. Required Fields

All fields below are required to save a property:

| Field | Type | Notes |
|-------|------|-------|
| `tenant_id` | UUID | Set from session — never from form input |
| `customer_name` | string (1–120 chars) | Display name — does not have to match GHL exactly |
| `address_line1` | string (1–200 chars) | Street address |
| `city` | string (1–100 chars) | |
| `state` | string (2 chars) | US state abbreviation (CA, TX, FL…) |
| `zip` | string | 5-digit or ZIP+4; validated by regex |
| `is_active` | boolean | Defaults to `true` on create |

---

## 4. Optional Fields

| Field | Type | Notes |
|-------|------|-------|
| `ghl_contact_id` | string | GHL contact reference. Set by webhook intake or manually. |
| `address_line2` | string | Apt, Suite, Unit |
| `gate_code` | string (max 20 chars) | Stored separately from access_notes for quick display. Shown prominently in technician view. |
| `access_notes` | text (max 1000 chars) | Dogs on property, parking instructions, alarm disarm, key location, etc. |
| `service_notes` | text (max 2000 chars) | Standing service instructions — e.g. "Always run backwash first", "Leave gate latched". Shown on every work order for this property. |
| `pool_equipment` | PoolEquipment (JSONB) | Current equipment snapshot — see Section 5. |

---

## 5. Pool Equipment Record Fields

Pool equipment is stored as a JSONB snapshot on the property, not in a separate table. This captures the *current* state. Equipment replacement history is out of scope for Phase 3 (planned for a future `equipment_records` table).

### 5.1 Pool Physical Specs

| Field | Type | Notes |
|-------|------|-------|
| `pool_size_gallons` | number | Approximate. Typical range 10,000–80,000. |
| `pool_shape` | PoolShape enum | rectangle, freeform, lap, sport, other |

### 5.2 Pump (`pool_equipment.pump`)

| Field | Type | Notes |
|-------|------|-------|
| `make` | string | e.g. Pentair, Hayward, Jandy |
| `model` | string | e.g. SuperFlo VS |
| `serial_number` | string | |
| `install_date` | YYYY-MM-DD | |
| `type` | PumpSpeedType | single_speed, dual_speed, variable_speed |
| `hp` | number | e.g. 1.5, 2.0 |
| `notes` | string | |

### 5.3 Filter (`pool_equipment.filter`)

| Field | Type | Notes |
|-------|------|-------|
| `make` | string | |
| `model` | string | |
| `serial_number` | string | |
| `install_date` | YYYY-MM-DD | |
| `type` | FilterType | cartridge, de (diatomaceous earth), sand |
| `size_sq_ft` | number | Filter surface area in sq ft |
| `notes` | string | |

### 5.4 Heater (`pool_equipment.heater`)

| Field | Type | Notes |
|-------|------|-------|
| `make` | string | |
| `model` | string | |
| `serial_number` | string | |
| `install_date` | YYYY-MM-DD | |
| `type` | HeaterType | gas, electric_heat_pump, solar, none |
| `btu_output` | number | e.g. 400000 for a 400k BTU unit |
| `notes` | string | |

### 5.5 Sanitizer System (`pool_equipment.sanitizer`)

| Field | Type | Notes |
|-------|------|-------|
| `make` | string | e.g. Hayward Aqua Rite (for salt cells) |
| `model` | string | |
| `serial_number` | string | |
| `install_date` | YYYY-MM-DD | |
| `type` | SanitizerType | chlorine, saltwater, uv, ozone, mineral, other |
| `notes` | string | |

### 5.6 Automation System (`pool_equipment.automation`)

| Field | Type | Notes |
|-------|------|-------|
| `make` | string | e.g. Pentair, Jandy, Hayward |
| `model` | string | e.g. IntelliCenter, iAqualink, OmniLogic |
| `serial_number` | string | |
| `install_date` | YYYY-MM-DD | |
| `notes` | string | |

### 5.7 Top-level Equipment Fields

| Field | Type | Notes |
|-------|------|-------|
| `additional_notes` | string | Anything not covered above |
| `last_updated` | ISO datetime | Set when a technician confirms equipment info on-site |

---

## 6. How Property Links to Work Orders

### 6.1 The Relationship
- A work order has exactly one `property_id` (FK → properties.id)
- A property can have many work orders over its lifetime
- Work orders are the history of what was done at a property

### 6.2 Display Rules
- Every work order shows the property's `customer_name`, `address_line1`, `city`
- Every work order detail page links back to the property profile
- The property detail page shows all work orders for that property (filterable by status, date range)

### 6.3 Creating a Work Order from a Property
- From the Property detail page, "New Work Order" pre-fills `property_id`, `customer_name`
- From the standalone "New Work Order" form (Phase 3+), a property search/select field is added
- In Phase 2 (current), work orders use `property_id: "prop-placeholder"` — this is replaced in Phase 3

### 6.4 Active Work Order Count
`PropertyWithRelations.active_work_order_count` counts WOs in non-terminal statuses:
`new`, `assigned`, `in_progress`, `estimate_needed`, `needs_follow_up`

Terminal statuses (`completed`, `cancelled`) do not count.

---

## 7. How Property Links to GHL Contact ID

### 7.1 The Link
- `property.ghl_contact_id` stores a GHL contact ID string (e.g. `"AbCdEf1234567890"`)
- This is the only GHL data stored in the ServiceOps database for a property
- Full contact data (name, email, phone, billing) is fetched from GHL API on demand — never stored

### 7.2 How the Link Is Set
Three paths:

| Path | Trigger | How |
|------|---------|-----|
| GHL Webhook intake | GHL sends a webhook when opportunity is won / appointment booked | Webhook handler creates or updates a property, sets `ghl_contact_id` from payload |
| Manual link | Office staff types or pastes a GHL contact ID | Property form has an optional "GHL Contact ID" field |
| Not set | Property created before GHL integration / manual import | `ghl_contact_id` is null — property still works, no GHL sync |

### 7.3 Multiple Properties Per GHL Contact
A GHL contact may have multiple properties. Each property stores the same `ghl_contact_id`. This allows a customer who owns two homes to have two property profiles, both linked to the same GHL customer record.

### 7.4 What the GHL Link Enables
When `ghl_contact_id` is set, the following features become available:
- View the customer's GHL contact from the property page (external link)
- Estimate-needed handoff creates/updates a GHL opportunity for this contact
- Completed job triggers a GHL status sync for this contact
- GHL webhook updates (name change, contact delete) can be reflected on the property

### 7.5 What the GHL Link Does NOT Do
- ServiceOps never stores the customer's phone, email, or full address from GHL
- ServiceOps never triggers customer-facing messages (SMS/email) — GHL owns that
- Removing a GHL contact does not delete the property or its work order history

---

## 8. Business Rules

1. **Tenant isolation**: every query must filter by `tenant_id`. A property is only visible to its tenant.
2. **Soft delete**: properties are deactivated (`is_active = false`), never hard-deleted. Work order history must be preserved.
3. **Address uniqueness**: no enforced DB-level uniqueness on address — a customer with a pool house and a main house at the same address is valid. Duplicates are managed by office staff.
4. **gate_code is plain text**: do not encrypt at the application layer for Phase 3. Flag for encryption in Phase 8 (security hardening) before launch.
5. **pool_equipment is a snapshot, not a log**: updating pump make/model overwrites the previous value. If history is needed, it's captured in technician notes or the future `equipment_records` table.
6. **customer_name sync**: if a GHL contact name changes, ServiceOps does NOT auto-update `customer_name`. The name on the property is the operational display name — it may drift from GHL. Manual correction is acceptable for Phase 3.
7. **New work order default**: when a new WO is created from a property, it inherits `service_notes` as the default `description` prefix — office staff can edit before saving.

---

## 9. Phase 3 Scope Boundary

### In Scope (Phase 3)
- Property list page (table view, filter by active/inactive)
- Property detail page (all fields, equipment display, work order history)
- Create/Edit property form (all fields)
- Link to GHL contact (manual, no live sync)
- New Work Order form updated to include property search/select
- Work order detail updated to link back to property profile
- Mock data (5 sample properties matching existing 5 mock WOs)
- API: GET (list + filters), POST, GET (by id), PATCH, DELETE — in-memory store

### Out of Scope (Phase 3)
- Live GHL contact data fetch (just store the ID)
- GHL contact name sync
- Equipment replacement history (`equipment_records` table)
- Recurring service schedules (Phase separate)
- Photo gallery on property (Phase 4)
- Map view of properties
- Bulk import from GHL contact list
- Property-level reporting (Phase 7)

---

## 10. TypeScript Location

All types live in `src/types/property.ts`:
- Enums: `SanitizerType`, `PumpSpeedType`, `FilterType`, `HeaterType`, `PoolShape`
- Interfaces: `EquipmentItem`, `PoolPump`, `PoolFilter`, `PoolHeater`, `SanitizerSystem`, `AutomationSystem`, `PoolEquipment`, `Property`, `PropertyWithRelations`
- Input types: `CreatePropertyInput`, `UpdatePropertyInput`

Zod validation schemas (to be written when API is built): `src/lib/validation/property.ts`

---

## 11. Database Schema (Supabase/PostgreSQL — future)

When the real DB is wired, the `properties` table will have:

```sql
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  ghl_contact_id  VARCHAR(100),
  customer_name   VARCHAR(120) NOT NULL,
  address_line1   VARCHAR(200) NOT NULL,
  address_line2   VARCHAR(100),
  city            VARCHAR(100) NOT NULL,
  state           CHAR(2) NOT NULL,
  zip             VARCHAR(10) NOT NULL,
  gate_code       VARCHAR(20),
  access_notes    TEXT,
  service_notes   TEXT,
  pool_equipment  JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX properties_tenant_id_idx ON properties(tenant_id);
CREATE INDEX properties_ghl_contact_id_idx ON properties(ghl_contact_id);
```

The `pool_equipment` column stores the `PoolEquipment` TypeScript interface serialized as JSONB. No separate `pool_equipment` table for Phase 3.
