# MEMORY.md — ServiceOps Command Center

_Last updated: Phase 3 — property detail page built (2026-05-04). Update after every major decision or build phase._

## Product Identity
- **Name**: ServiceOps Command Center
- **Type**: GHL-integrated work order and field operations SaaS
- **First client**: Showtime Pool Service, California
- **Future vision**: White-label Jobber-style add-on for GHL users

## Build Phase Status
| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Scaffold | ✅ Done |
| 1 | MVP UI Shell + Navigation | ✅ Done |
| 1b | Technician Mobile Shell (/tech/today) | ✅ Done |
| 2 | Work Order Module | ✅ Done (list + detail + New WO modal, mock data + API) |
| 3 | Property Profile Module | 🔄 In Progress (types + spec + list + detail + API done; Add Property form pending) |
| 4 | Technician Mobile View (full) | ⏳ Pending |
| 5 | GHL Webhook Intake | ⏳ Pending |
| 6 | Status Sync Back to GHL | ⏳ Pending |
| 7 | Reporting Dashboard | ⏳ Pending |
| 8 | QA and Launch | ⏳ Pending |

## Confirmed Decisions (Phase 3 — Properties)
- **Equipment storage**: `pool_equipment` stored as JSONB on `properties` table — one snapshot of current state, not history. Equipment replacement history is out of scope until Phase 4+.
- **`ghl_contact_id` is optional**: properties can exist without a GHL link (manual entry, import before integration). Three paths to set it: webhook intake, manual paste, or unset.
- **`gate_code` is a separate field**: split from `access_notes` so technicians can see it at a glance without reading free text. Plain text in Phase 3 — flag for encryption in Phase 8 security hardening.
- **`customer_name` does not auto-sync with GHL**: it's the operational display name and may drift. Manual correction is acceptable for Phase 3.
- **`PropertyWithRelations`**: adds `active_work_order_count` (non-terminal WOs only), `last_service_date`, `last_service_technician_name` — computed when DB is wired, hardcoded in mock data.
- **Soft delete only**: `is_active = false` — never hard-delete a property. Work order history must survive.

## Confirmed Decisions (Phase 2)
- **WO number format**: `WO-XXXX` — 4-digit zero-padded sequential per tenant. e.g. `WO-0001`, `WO-0042`. No year prefix. Easy to say on the phone. Auto-expands past 9999.
- **Multi-visit scope**: Phase 2 = work-order-as-the-job, no visible visits in UI. One visit record created silently in background per WO (zero-migration path for Phase 3). Visits layer surfaces in Phase 3. Two-trip jobs = two separate WOs for MVP.
- **Work order spec**: `specs/feature-work-orders.md` — required fields, status lifecycle, assignment rules, estimate handoff state machine. All decisions recorded there.
- **Status transitions**: Codified in `WORK_ORDER_STATUS_TRANSITIONS` constant in `src/types/work-order.ts`. Do not hardcode transitions elsewhere.

## Tech Stack (Confirmed)
- **Framework**: Next.js 15, App Router — no Pages Router ever
- **Language**: TypeScript strict mode — no `any`
- **Styling**: Tailwind CSS only — no inline styles, no custom CSS unless unavoidable
- **UI components**: shadcn/ui-compatible pattern (Radix primitives approach)
- **Icons**: lucide-react
- **Class utility**: `cn()` from `clsx` + `tailwind-merge` — lives in `src/lib/utils/index.ts`
- **Fonts**: `Sora` (display/headings) + `Plus Jakarta Sans` (body) via `next/font/google`
- **Database**: Placeholder — Supabase/PostgreSQL planned, not wired yet
- **Auth**: Placeholder — no real auth in Phase 1–2, role hardcoded as TENANT_ADMIN

## Brand / Design Tokens (Established Phase 1)
- **Sidebar bg**: `#0C1E2E` (deep ocean navy) — used as hex inline or via `bg-sidebar-bg`
- **Sidebar active**: `#1A3A52` — `bg-sidebar-active`
- **Sidebar hover**: `#132C42` — `bg-sidebar-hover`
- **Sidebar border**: `#1E3348`
- **Sidebar text muted**: `#94A3B8` — `text-sidebar-text`
- **Sidebar text active**: `#F0F9FF` — `text-sidebar-text-active`
- **Primary accent**: cyan — `brand-500` = `#06B6D4` (pool/water connection)
- **Warning/estimate accent**: amber — `amber-500` = `#F59E0B` (California sun)
- **Content bg**: `bg-background` = slate-50 via CSS var
- **Card bg**: white with `border border-border shadow-sm rounded-xl`
- **StatCard accent top border**: brand (cyan), amber, green (emerald), red

## Status Badge Color Map (Use Consistently Across All Pages)
| Status | Badge classes |
|--------|--------------|
| new | `bg-slate-100 text-slate-600` |
| assigned | `bg-blue-50 text-blue-700` |
| in_progress | `bg-brand-50 text-brand-700` |
| completed | `bg-emerald-50 text-emerald-700` |
| needs_follow_up | `bg-orange-50 text-orange-700` |
| estimate_needed | `bg-amber-50 text-amber-700` |
| cancelled | `bg-red-50 text-red-500` |

## Priority Badge Color Map
| Priority | Badge classes |
|----------|--------------|
| low | `bg-slate-100 text-slate-500` |
| normal | `bg-slate-100 text-slate-600` |
| high | `bg-orange-50 text-orange-600` |
| urgent | `bg-red-50 text-red-600` |

## Component Architecture (Phase 1 Built)
### Layout Components — `src/components/layout/`
- `DashboardShell.tsx` — client component, manages `mobileNavOpen` state, wraps all `/dashboard/*`
- `Sidebar.tsx` — server-compatible, ocean-navy sidebar, logo + nav + Settings pinned bottom + tenant badge
- `SidebarNavItem.tsx` — `'use client'`, uses `usePathname()` for active state, cyan left-border indicator on active
- `TopBar.tsx` — `'use client'`, derives page title from pathname map, hamburger (mobile only), bell + avatar
- `MobileNav.tsx` — `'use client'`, slide-in drawer with backdrop, Escape key + body scroll lock
- `TechShell.tsx` — separate mobile-only layout for `/tech/*`, no sidebar, high-contrast outdoor design
- `Breadcrumb.tsx` — server component; accepts `BreadcrumbItem[]` (`label` + optional `href`); Home icon always links to `/dashboard/overview`; last item has `aria-current="page"` and is non-linked; `ChevronRight` separator

### Dashboard Components — `src/components/dashboard/`
- `StatCard.tsx` — 4 accent variants (brand/amber/green/red), colored top border, icon badge, trend text
- `WorkOrdersTable.tsx` — `'use client'`; status + category filter dropdowns; 8-column table; links to detail page
- `WorkOrderDetail.tsx` — `'use client'`; receives `workOrder` prop; local status/estimateHandoff state; status transition select + Estimate Needed button; SectionCard + Field sub-components; GHL links section; Estimate Handoff card
- `NewWorkOrderModal.tsx` — slide-over drawer; Zod client-side validation; priority segment control; POSTs to `/api/work-orders`; success state → auto-close
- `NewWorkOrderButton.tsx` — `'use client'` wrapper keeping `work-orders/page.tsx` a server component; owns modal open state + success banner (6s auto-dismiss)
- `PropertiesTable.tsx` — `'use client'`; real-time `useMemo` search (name + address + city) + active/inactive filter; 7-column table with avatar initials, GHL indicator, WO count badge, equipment badge
- `PropertyDetail.tsx` — `'use client'`; receives `property: PropertyWithRelations` + `relatedWorkOrders` props; per-section inline edit (equipment, access notes, service notes); draft state pattern with start/save/cancel handlers; equipment edit form organized by sub-section (pump/filter/heater/sanitizer/automation); gate code shown as amber badge; WO history as mini-table linking to detail pages; New Work Order modal integration

### Route Structure Built
```
src/app/
  page.tsx                         → redirect to /dashboard/overview
  layout.tsx                       → root layout, fonts loaded here
  dashboard/
    layout.tsx                     → wraps children in DashboardShell
    overview/page.tsx              → KPI cards + today's jobs + alerts + tech status
    work-orders/page.tsx           → Phase 2: ✅ work order table with filters + mock data
    work-orders/[id]/page.tsx      → Phase 2: ✅ detail page — all fields, status dropdown, estimate flag, handoff section
    properties/page.tsx            → Phase 3: ✅ properties table — search + active filter + 5 mock properties
    properties/[id]/page.tsx       → Phase 3: ✅ detail page — equipment, access notes, service notes, WO history, inline edit
    technicians/page.tsx           → empty state
    visits/page.tsx                → empty state
    estimates/page.tsx             → empty state
    reports/page.tsx               → empty state
    settings/page.tsx              → 5 setting category cards, all "Coming Soon"
  api/
    work-orders/route.ts           → Phase 2: ✅ GET (filters: status/category/tenant_id) + POST
    work-orders/[id]/route.ts      → Phase 2: ✅ GET + PATCH (with transition validation) + DELETE
    properties/route.ts            → Phase 3: ✅ GET (filter: is_active, tenant_id) + POST (Zod)
    properties/[id]/route.ts       → Phase 3: ✅ GET + PATCH (Zod, tenant-scoped)
  tech/
    layout.tsx                     → wraps children in TechShell (mobile-only)
    today/page.tsx                 → 3 placeholder job cards, date header, status badges
```

## Navigation Config (`src/config/navigation.ts`)
- `NavItem` interface has: `label`, `href`, `icon` (Lucide name string), `roles: UserRole[]`, `pinBottom?: boolean`
- `adminNavItems` — 8 items; Settings has `pinBottom: true`
- `techNavItems` — 1 item (Today's Jobs)
- Icon string → Lucide component map lives in `SidebarNavItem.tsx`

## Key Coding Patterns (Repeat These)
- `cn()` from `@/lib/utils` for all conditional classNames
- `usePathname()` for active nav detection — always in `'use client'` components
- Dashboard pages: `export const metadata: Metadata = { title: "Page Name" }` for tab titles
- All stat card / empty state / page header patterns are established — follow existing pages as template
- Sidebar bg color applied as `style={{ backgroundColor: "#0C1E2E" }}` (Tailwind JIT can't generate arbitrary hex in some cases)
- **Breadcrumb pattern**: every dashboard page starts with `<Breadcrumb items={[{ label: "Page Name" }]} className="mb-2" />` above its `<h2>`. For nested pages (e.g. `/dashboard/work-orders/[id]`), pass two items: `[{ label: "Work Orders", href: "/dashboard/work-orders" }, { label: "WO-001" }]`
- **Nav link audit**: all 8 admin nav hrefs verified correct; active state logic `pathname === href || pathname.startsWith(href + "/")` handles both exact and nested routes correctly — do not change this logic
- **Status/priority badges**: inline `<span>` with Tailwind classes from the badge color maps above. No external badge component yet. Pattern: `rounded-full px-2.5 py-0.5 text-xs font-medium`
- **Filter controls pattern** (Phase 2 established): `'use client'` wrapper component holds filter state; receives full data array as prop, returns filtered subset to render. Server page passes mock data down.
- **shadcn/ui Table**: use `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` from `@/components/ui/table`. File lives at `src/components/ui/table.tsx`.
- **Shared mock data**: `src/lib/mock-data/work-orders.ts` — `MOCK_WORK_ORDERS: WorkOrderWithRelations[]` — 5 realistic WOs. Both list and detail import from here. Replace with API call when DB is wired.
- **WorkOrderDetail pattern**: `'use client'` component receives `workOrder` prop from server page. Status state is local (`useState`). Status transitions read from `WORK_ORDER_STATUS_TRANSITIONS` constant. `key={status}` on the select forces reset after each transition.
- **Detail page params**: Next.js 15 — `params` is `Promise<{ id: string }>`, must `await params`. Use `notFound()` from `next/navigation` for missing IDs.
- **Estimate Needed button**: shown only when `WORK_ORDER_STATUS_TRANSITIONS[status].includes(ESTIMATE_NEEDED)`. Clicking it sets status → ESTIMATE_NEEDED and estimateHandoff → FLAGGED. Filtered out of the "Change status" dropdown to avoid duplication.
- **EstimateHandoffStatus display**: `ESTIMATE_HANDOFF_CONFIG` in `WorkOrderDetail.tsx` maps each status to label + className + description. Handoff section only renders when `estimateHandoff !== NOT_NEEDED`.
- **GHL links section**: renders inside Job Info card only when `ghl_contact_id` or `ghl_opportunity_id` are present on the work order.
- **New Work Order modal pattern**: `NewWorkOrderButton` (client) wraps both the trigger button and modal so the page stays a server component. Modal is a slide-over (`fixed inset-y-0 right-0 max-w-lg translate-x-full → translate-x-0`). On success: modal shows CheckCircle + WO number for 1800ms then auto-closes; `NewWorkOrderButton` shows emerald banner for 6s.
- **Zod schema location**: `src/lib/validation/work-order.ts` — `NewWorkOrderSchema` + `NewWorkOrderInput` + `NewWorkOrderFieldErrors` types. Shared by modal client and API route.
- **Priority selector**: 4-button segment control (not a `<select>`). Active colors: Low=slate-600, Normal=brand-500, High=orange-500, Urgent=red-500. `PRIORITY_ACTIVE` map in `NewWorkOrderModal.tsx`.
- **Service category config**: `serviceTypes` array in `src/config/service-types.ts`. Also defines `PRIORITY_OPTIONS` (with `urgencyHint`) and `MOCK_TECHNICIANS` (Carlos M., Sarah K.).
- **Mock API sequence**: `POST /api/work-orders` starts at WO-0006 (mock counter). Validates with Zod, returns 201 `{ data: createdWorkOrder }`. Sets `tenant_id: "tenant-showtime"`, `status: NEW`, `estimate_handoff_status: NOT_NEEDED`.

## Validation Schemas (`src/lib/validation/`)
- **`work-order.ts`**:
  - `NewWorkOrderSchema` — form fields only (title, service_category, priority, description, scheduled_date, assigned_technician_id). Used by modal + POST route.
  - `NewWorkOrderInput` — inferred type
  - `NewWorkOrderFieldErrors` — `Partial<Record<keyof NewWorkOrderInput, string>>` — used for form error state
  - `PatchWorkOrderSchema` — all fields optional, adds `status` + `estimate_handoff_status` + time fields. Used by PATCH route.
  - `PatchWorkOrderInput` — inferred type
- **`property.ts`** — `CreatePropertySchema` + `CreatePropertyInput` (POST body), `PatchPropertySchema` + `PatchPropertyInput` (PATCH body). Shared `EquipmentItemSchema` base extended by `PoolPumpSchema`, `PoolFilterSchema`, `PoolHeaterSchema`, `SanitizerSystemSchema`, `AutomationSystemSchema`, composed into `PoolEquipmentSchema`. Helper `optStr(maxLen)` returns optional string with empty-string-to-undefined coercion. `optDate` validates YYYY-MM-DD with same coercion.

## Mock Data Files (`src/lib/mock-data/`)
- **`work-orders.ts`** — `MOCK_WORK_ORDERS: WorkOrderWithRelations[]` — 5 WOs (WO-0001 to WO-0005). Read-only seed. Used by list page and detail page lookup.
- **`store.ts`** — mutable in-memory store for work orders API. Seeded from `MOCK_WORK_ORDERS` via `structuredClone`. Exports: `listWorkOrders`, `createWorkOrder`, `updateWorkOrder`, `deleteWorkOrder`, `getWorkOrderById`.
- **`properties.ts`** — `MOCK_PROPERTIES: PropertyWithRelations[]` — 5 properties (prop-001 to prop-005) matching the 5 mock WOs. Rich `pool_equipment` data on all 5.
- **`property-store.ts`** — mutable in-memory store for properties API. Seeded via `structuredClone(MOCK_PROPERTIES)`. Exports: `listProperties`, `getPropertyById`, `createProperty`, `updateProperty`. `PropertyUpdateResult` = `{ ok: true, data }` | `{ ok: false, notFound: true }`. All operations require matching `tenant_id` (default "tenant-showtime"). `updateProperty` preserves `id`, `tenant_id`, `created_at`, and computed relation fields (`active_work_order_count`, `last_service_date`, `last_service_technician_name`).

## Work Order API Layer (`src/app/api/work-orders/`)
- **In-memory store**: `src/lib/mock-data/store.ts` — seeded from `MOCK_WORK_ORDERS` via `structuredClone`. Persists within a warm process instance, resets on cold start. Replace with DB queries in Phase DB.
- **`listWorkOrders({ tenant_id, status, category })`** — filters in store; defaults tenant to "tenant-showtime"
- **`createWorkOrder(input, tenantId)`** — appends to store, auto-increments `wo_number`
- **`updateWorkOrder(id, patch)`** → discriminated union: `{ ok: true, data }` | `{ ok: false, notFound }` | `{ ok: false, transitionError }`. Validates status transitions, auto-sets `completed_at`.
- **`deleteWorkOrder(id)`** → boolean
- **`PatchWorkOrderSchema`** in `src/lib/validation/work-order.ts` — all fields optional; validates enum values but NOT transitions (that's the route's job)
- **Response shape**: `{ data: T }` for success; `{ error, issues? }` for failure; `{ error, allowed_transitions }` for bad transition
- **Status codes**: 200 (GET/PATCH/DELETE), 201 (POST), 400 (bad param/JSON), 404 (not found), 422 (validation / bad transition)

## Property Types (`src/types/property.ts`) — Phase 3
- **`SanitizerType`** enum: chlorine, saltwater, uv, ozone, mineral, other
- **`PumpSpeedType`** enum: single_speed, dual_speed, variable_speed
- **`FilterType`** enum: cartridge, de, sand
- **`HeaterType`** enum: gas, electric_heat_pump, solar, none
- **`PoolShape`** enum: rectangle, freeform, lap, sport, other
- **`EquipmentItem`** base interface: make?, model?, serial_number?, install_date? (YYYY-MM-DD), notes?
- **`PoolPump`** extends EquipmentItem: type?: PumpSpeedType, hp?: number
- **`PoolFilter`** extends EquipmentItem: type?: FilterType, size_sq_ft?: number
- **`PoolHeater`** extends EquipmentItem: type?: HeaterType, btu_output?: number
- **`SanitizerSystem`** extends EquipmentItem: type?: SanitizerType
- **`AutomationSystem`** extends EquipmentItem (make/model/serial only)
- **`PoolEquipment`**: pool_size_gallons?, pool_shape?, pump?, filter?, heater?, sanitizer?, automation?, additional_notes?, last_updated?
- **`Property`** interface: id, tenant_id, ghl_contact_id? (optional — not all have GHL link), customer_name, address fields, gate_code?, access_notes?, service_notes?, pool_equipment?, is_active, created_at, updated_at
- **`PropertyWithRelations`**: extends Property + active_work_order_count, last_service_date?, last_service_technician_name?
- **`CreatePropertyInput`**: omits id/created_at/updated_at
- **`UpdatePropertyInput`**: partial, omits id/tenant_id/created_at/updated_at
- **Mock data**: `src/lib/mock-data/properties.ts` — `MOCK_PROPERTIES: PropertyWithRelations[]` — 5 realistic CA pool properties matching the 5 mock WOs (Rodriguez/prop-001 through Thompson/prop-005). Rich equipment data (make/model/serial/install_date) on all 5.
- **Spec**: `specs/feature-property-profiles.md` — full spec written 2026-05-04

## Property Detail Page Patterns (`PropertyDetail.tsx`)
- **Inline edit pattern**: per-section toggle. `startEdit*()` re-initializes draft from current state; `save*()` updates local `prop` state + shows 5s info banner; `cancel*()` resets draft + closes form.
- **Equipment edit**: single `eqDraft: PoolEquipment` state. Sub-updaters `updatePump/Filter/Heater/Sanitizer/Automation(key, value)` use spread to update nested objects. `startEditEquipment()` re-initializes from current `prop.pool_equipment`. Save sets `last_updated` to current ISO timestamp.
- **Equipment display**: pool specs (gallons + shape) as a summary row; 5 sub-cards in 2-col grid (pump/filter/heater/sanitizer) + automation full-width; `EquipmentBlock` shows "Not on file" when sub-system is absent; pump notes shown as amber left-border callout.
- **Gate code display**: amber badge with monospaced bold text + `tracking-widest` — visually prominent for technicians.
- **WO history**: mini `<table>` (not shadcn Table) inside the card; columns: WO#, Title, Status badge, Scheduled date, Tech. Links to WO detail pages. relatedWorkOrders filtered on server by `property_id`.
- **Server page pattern**: `generateMetadata` + default export both `await params`; filter `MOCK_WORK_ORDERS` by `property_id` and pass as prop. `notFound()` on missing ID.
- **WO → Property link fixed**: `WorkOrderDetail.tsx` "View Property" link now uses `/dashboard/properties/${workOrder.property_id}` (was `/dashboard/properties`).
- **`EF` helper**: tiny `<dt>/<dd>` pair inside `EquipmentBlock` — returns `null` if value is nullish/empty (avoids showing empty fields in read view).
- **`EqSubFormHeader`**: small uppercase section label between equipment sub-form groups.

## Properties List Page Patterns (`PropertiesTable.tsx`)
- **Search**: real-time `useMemo` filter on `customer_name + address_line1 + city` (case-insensitive). Input has inline X to clear. Search box has focus ring matching brand-400.
- **Active filter**: `<select>` with "All Properties" / "Active Only" / "Inactive Only" — same pattern as WO status filter.
- **Count display**: "5 properties" / "1 of 5 properties" — updates when either filter is active.
- **Clear button**: appears when any filter active; clears both search + dropdown at once.
- **Avatar column**: single initial in brand-50/brand-700 circle, customer name as link to `/dashboard/properties/[id]`, "GHL linked" sub-label with ExternalLink icon if `ghl_contact_id` is set.
- **Work Orders column**: cyan badge "N active" if count > 0; slate "None" badge if 0.
- **Equipment column**: emerald "On file" badge with Wrench icon if `pool_equipment` present; "—" otherwise.
- **Status column**: emerald "Active" / slate "Inactive" rounded-full badge.
- **Empty state**: MapPin icon + "No properties found" + contextual hint when filters active.

## Work Order Types (`src/types/work-order.ts`)
- `WorkOrderStatus`: new, assigned, in_progress, completed, needs_follow_up, estimate_needed, cancelled
- `Priority`: low, normal, high, urgent
- `ServiceCategory`: 10 values — weekly_pool_maintenance, pool_repair, pool_inspection_diagnostic, filter_cleaning, heater_service, equipment_installation, pool_remodel, new_construction, emergency_service, other
- `EstimateHandoffStatus`: not_needed, flagged, sent_to_ghl, estimate_sent, approved, declined
- `WorkOrder` interface: all DB fields; optional fields use `?`
- `CreateWorkOrderInput`: status + estimate_handoff_status are optional (default NEW / NOT_NEEDED)
- `UpdateWorkOrderInput`: partial, tenant_id is immutable
- `WorkOrderWithRelations`: extends WorkOrder with `property_address`, `property_customer_name`, `assigned_technician_name?`
- `WORK_ORDER_STATUS_TRANSITIONS`: allowed-transitions map — use this for validation, not hardcoded logic

## Other Key Enums
- `UserRole`: platform_owner, tenant_admin, office_staff, technician, read_only_owner
- `VisitStatus`: scheduled, in_progress, completed, skipped, rescheduled, cancelled

## GHL Boundaries (Do Not Cross)
GHL handles: CRM, contacts, conversations, forms, lead capture, pipelines, calendars, SMS/email, marketing automations, missed-call text-back.
ServiceOps handles: work orders, visits, property profiles, technician workflow, checklists, photos, notes, completion reports.

## Confirmed Client Context
- Client: Showtime Pool Service, California
- Current stack: GoHighLevel
- Service type: Pool service (weekly maintenance, repairs, emergency, equipment installs)
- Team: Owner + technicians in the field
- Needs: Work orders, job checklists, field photos, service history per property

## Dependencies Installed
- `next` 15, `react` 18, `typescript` 5, `tailwindcss` 3.4
- `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`
- `zod` (v4) — installed for form + API validation

## Open Questions
- Which GHL plan does Showtime use? (affects API access tier)
- GHL OAuth vs Private Integration Token?
- Photo storage: Supabase Storage, AWS S3, or Cloudinary?
- Recurring visits: GHL calendar sync or internal schedule?
- Estimate handoff: create new GHL opportunity or update existing?

## Detailed Memory Files Location
- memory/product-decisions.md — architecture and product decisions
- memory/confirmed-facts.md — confirmed client/business facts
- memory/assumptions.md — unconfirmed working assumptions
- memory/glossary.md — term definitions
- memory/client-showtime-pools.md — client-specific notes
- memory/ghl-rules.md — GHL integration rules
- memory/technical-decisions.md — tech stack decisions
- memory/open-questions.md — questions to resolve
