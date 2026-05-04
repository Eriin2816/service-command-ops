# Feature Spec: Work Orders (Phase 2)

_Last updated: 2026-05-04 — decisions recorded_

---

## 1. Purpose

Work Orders are the central operational record in ServiceOps. Each work order represents a job to be performed at a specific property, assigned to a technician, tracked through a defined lifecycle, and optionally linked back to a GHL contact and opportunity.

This spec covers: required fields, status lifecycle, assignment rules, and the estimate handoff trigger. UI layout is in `app-blueprint/page-work-orders.md` and `app-blueprint/page-work-order-detail.md`.

---

## 2. Required Fields

### To Create a Work Order

| Field | Required | Notes |
|-------|----------|-------|
| `tenant_id` | Yes | System-set from session context. Never user-supplied. |
| `property_id` | Yes | Must be a valid property belonging to the same tenant. |
| `title` | Yes | Short job description. Max 120 characters. |
| `service_category` | Yes | One of `ServiceCategory` enum values. |
| `priority` | No | Defaults to `NORMAL`. |
| `status` | No | Defaults to `NEW`. |
| `estimate_handoff_status` | No | Defaults to `NOT_NEEDED`. |
| `description` | No | Long-form job notes. No max enforced at DB level. |
| `assigned_technician_id` | No | Can be set at creation or later. |
| `scheduled_date` | No | ISO date "YYYY-MM-DD". |
| `scheduled_time_start` | No | "HH:MM" (24h). |
| `scheduled_time_end` | No | "HH:MM" (24h). Must be after `scheduled_time_start`. |
| `ghl_contact_id` | No | Set when work order originates from GHL webhook. |
| `ghl_opportunity_id` | No | Set when work order originates from GHL webhook. |

### Validation Rules
- `title`: 1–120 characters, must not be blank after trimming.
- `scheduled_time_end` must be strictly after `scheduled_time_start` if both are set.
- `assigned_technician_id` must belong to the same `tenant_id` and have role `TECHNICIAN`.
- `property_id` must belong to the same `tenant_id`.

---

## 3. Status Lifecycle

### States

| Status | Meaning |
|--------|---------|
| `new` | Work order created; no technician assigned yet. |
| `assigned` | Technician assigned and scheduled; awaiting start. |
| `in_progress` | Technician has begun work on-site. |
| `completed` | All visits done; job closed. |
| `needs_follow_up` | Issue discovered; requires another visit or attention. |
| `estimate_needed` | Technician flagged work that requires a formal estimate before proceeding. |
| `cancelled` | Job cancelled. Terminal state — no further transitions. |

### Allowed Transitions

```
NEW            → ASSIGNED         (admin/office assigns technician)
NEW            → CANCELLED        (admin cancels before assignment)

ASSIGNED       → IN_PROGRESS      (technician starts job in mobile view)
ASSIGNED       → NEW              (admin unassigns technician)
ASSIGNED       → CANCELLED        (admin cancels before work starts)

IN_PROGRESS    → COMPLETED        (all visits marked complete)
IN_PROGRESS    → ESTIMATE_NEEDED  (technician flags estimate required)
IN_PROGRESS    → NEEDS_FOLLOW_UP  (office staff flags an issue)

COMPLETED      → NEEDS_FOLLOW_UP  (post-close issue discovered)

ESTIMATE_NEEDED → IN_PROGRESS     (estimate declined; continue original work)
ESTIMATE_NEEDED → CANCELLED       (estimate declined; job not proceeding)

NEEDS_FOLLOW_UP → ASSIGNED        (re-assigned for follow-up visit)

CANCELLED      → (none)           (terminal)
```

### Invalid Transitions (rejected by API)
- `COMPLETED → IN_PROGRESS` — do not re-open. Create a new work order instead.
- `CANCELLED → anything` — cancelled is terminal.
- Any transition not listed above.

### Transition Source Code
Allowed transitions are codified in `WORK_ORDER_STATUS_TRANSITIONS` in `src/types/work-order.ts`. API routes and UI button state must read from this constant — do not hardcode transition logic elsewhere.

---

## 4. Assignment Rules

### Who Can Assign
- `TENANT_ADMIN`: full assign/unassign/reassign on any work order.
- `OFFICE_STAFF`: full assign/unassign/reassign on any work order.
- `TECHNICIAN`: cannot assign. Can only start or complete their own assigned jobs.
- `READ_ONLY_OWNER`: no write access.

### How Assignment Affects Status
| Action | Precondition | Status Effect |
|--------|-------------|---------------|
| Assign technician | Status = `NEW` | Status → `ASSIGNED` |
| Assign technician | Status = `ASSIGNED` | Status unchanged (reassignment) |
| Unassign technician | Status = `ASSIGNED` | Status → `NEW` |
| Assign during creation | Any | Status stays `NEW` unless explicitly set to `ASSIGNED` |

### Constraints
- One assigned technician at a time (single `assigned_technician_id`). No multi-tech for MVP.
- The assigned technician must be active (`is_active = true`) and belong to the same tenant.
- Assigning to a different technician while `IN_PROGRESS` is blocked in the UI (but not the API — office staff may need this in exceptional cases). Show a warning if attempted.

---

## 5. Estimate Handoff Trigger

### What It Is
When a technician encounters unexpected work that needs a formal estimate (e.g., cracked pool shell, failed equipment that requires parts quote), they flag the job. This puts the work order into `ESTIMATE_NEEDED` status and starts the `EstimateHandoffStatus` state machine, which tracks the GHL handoff independently.

### Trigger Sources
1. **Technician flag (primary)**: Technician taps "Flag Estimate Needed" in mobile visit view → `visit.estimate_flagged = true` → work order status → `ESTIMATE_NEEDED` → `estimate_handoff_status` → `FLAGGED`.
2. **Office manual flag**: Admin/office staff sets work order status to `ESTIMATE_NEEDED` from the dashboard detail view.

### EstimateHandoffStatus State Machine

```
NOT_NEEDED → FLAGGED
  Trigger: Technician flags visit OR office manually sets ESTIMATE_NEEDED

FLAGGED → SENT_TO_GHL
  Trigger: Office staff clicks "Send to GHL" in work order detail view
  Action: ServiceOps calls GHL API → creates task on opportunity or updates pipeline stage
  Requires: ghl_opportunity_id must be set. If not set → show error, prompt manual entry.

SENT_TO_GHL → ESTIMATE_SENT
  Trigger: GHL webhook confirms estimate was sent to customer (Phase 6)
  OR: Office staff manually advances (if GHL webhook not yet wired)

ESTIMATE_SENT → APPROVED
  Trigger: GHL webhook or office staff manual confirmation
  Effect: Work order remains ESTIMATE_NEEDED; office creates follow-up work order

ESTIMATE_SENT → DECLINED
  Trigger: GHL webhook or office staff manual confirmation
  Effect: Office chooses to resume job (→ IN_PROGRESS) or cancel (→ CANCELLED)
```

### Edge Cases
- **No GHL opportunity linked**: Log the attempt; show admin a banner: "No GHL opportunity linked. Enter a GHL Opportunity ID to complete handoff, or continue manually."
- **GHL API unavailable**: Queue the handoff for retry; do not block the work order from being saved in `FLAGGED` state.
- **Estimate approved → new scope**: Create a new work order for the approved scope. Do not mutate the original work order's description after close.
- **Technician flags estimate on already-completed visit**: Not allowed. Estimate flag is only available while `visit.status = IN_PROGRESS`.

---

## 6. Work Order — Visit Relationship

A work order can have one or more associated visits. Status rules:

- Work order status becomes `COMPLETED` only when all its visits have `status = COMPLETED`.
- If any visit is `ESTIMATE_NEEDED`-flagged, the work order moves to `ESTIMATE_NEEDED` regardless of other visits.
- Cancelling a work order does not auto-cancel individual visits — office staff must cancel visits manually.

---

## 7. Access Control Summary

| Action | PLATFORM_OWNER | TENANT_ADMIN | OFFICE_STAFF | TECHNICIAN | READ_ONLY_OWNER |
|--------|---------------|--------------|--------------|------------|-----------------|
| View list | ✅ | ✅ | ✅ | own only | ✅ |
| View detail | ✅ | ✅ | ✅ | own only | ✅ |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit (fields) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign technician | ✅ | ✅ | ✅ | ❌ | ❌ |
| Change status | ✅ | ✅ | ✅ | limited* | ❌ |
| Cancel | ✅ | ✅ | ✅ | ❌ | ❌ |
| Flag estimate | ✅ | ✅ | ✅ | ✅ | ❌ |
| Send to GHL | ✅ | ✅ | ✅ | ❌ | ❌ |

*Technician: can only transition `ASSIGNED → IN_PROGRESS` and `IN_PROGRESS → COMPLETED` or `IN_PROGRESS → ESTIMATE_NEEDED` on their own assigned work orders.

---

## 8. UI Scope (Phase 2)

### `/dashboard/work-orders` (List Page)
- Table/card list of all work orders for the tenant
- Columns: WO number (auto-generated display ID), title, property/customer, technician, status badge, priority badge, scheduled date
- Filter by: status (multi-select), priority, assigned technician, service category
- Sort by: scheduled date (default), created date, priority
- Empty state: "No work orders yet. Create your first one."
- "New Work Order" button → opens create form (modal or slide-over)

### `/dashboard/work-orders/[id]` (Detail Page)
- Header: WO number, title, status badge, priority badge
- Breadcrumb: Home › Work Orders › WO-001
- Sections:
  - **Job Info**: service category, description, GHL links (if present)
  - **Schedule**: date, start/end time
  - **Assignment**: technician selector, schedule date/time pickers
  - **Property**: customer name, address, link to property page
  - **Estimate Handoff**: visible only when `estimate_handoff_status ≠ NOT_NEEDED`
  - **Status History**: simple log of status transitions with timestamps (Phase 2: placeholder)
  - **Visits**: list of associated visits with status (Phase 3)
- Action bar: status transition buttons based on current status + user role

### Create Work Order Form
- Required: title, property (searchable select), service category
- Optional: description, priority (default NORMAL), assigned technician, scheduled date/time
- Submit → POST `/api/work-orders` → redirect to detail page

---

## 9. API Routes (Phase 2)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/work-orders` | List (tenant-scoped, filterable) |
| POST | `/api/work-orders` | Create |
| GET | `/api/work-orders/[id]` | Detail |
| PATCH | `/api/work-orders/[id]` | Update fields |
| POST | `/api/work-orders/[id]/status` | Transition status (validates against allowed transitions) |
| POST | `/api/work-orders/[id]/assign` | Assign/reassign/unassign technician |
| POST | `/api/work-orders/[id]/estimate-handoff` | Advance estimate handoff status |

All routes: require auth, enforce tenant isolation, validate with Zod.

---

## 10. Decisions

- **WO number format**: `WO-XXXX` — 4-digit zero-padded sequential per tenant (e.g. `WO-0001`, `WO-0042`). No year prefix. Simple to say on the phone. Auto-expands past WO-9999. ✅ Confirmed 2026-05-04.
- **Multi-visit MVP scope**: Phase 2 = work-order-as-the-job, no visible visits in UI. One visit record created silently in the background per WO (zero-migration path for Phase 3). Visits layer surfaces in Phase 3. Two-trip jobs handled by creating two separate WOs for MVP. ✅ Confirmed 2026-05-04.
- **Status history log**: Required for Phase 2 or Phase 3? Recommendation: include a simple in-memory placeholder in Phase 2, wire to DB in Phase 3.
