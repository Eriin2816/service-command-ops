# Spec — Multi-Tenant Onboarding Flow

**Status:** Draft — not yet built  
**Phase:** 9 (Multi-Tenant SaaS Hardening)  
**Depends on:** Phases 1–8 complete, Supabase live, NextAuth wired to DB users table  

---

## 1. Purpose

ServiceOps currently supports exactly one tenant (`tenant-showtime`) hardcoded in the auth config. This spec defines the full onboarding flow for adding new tenants as a self-service or admin-assisted process:

1. Tenant account creation (company details)
2. GHL Location ID collection
3. GHL API token setup and verification
4. First admin user account creation
5. Default checklist template seeding

At the end of onboarding, the new tenant has a fully operational ServiceOps account: their admin can log in, the GHL webhook is configured for their location, and pool service checklists are pre-loaded and ready for use.

---

## 2. Actors

| Actor | Description |
|---|---|
| **Platform Owner** | Adaptive Automate / ServiceOps operator — can create and manage all tenants via a private platform admin UI |
| **Tenant Admin** | Incoming client (e.g. "Showtime Pool Service") — goes through onboarding to set up their account |
| **GHL Location** | The GHL sub-account associated with the tenant's business |

---

## 3. Onboarding Modes

Two modes are supported. Both produce the same end state.

### Mode A — Self-Service (future)
Tenant signs up via a public `/signup` page. Guided wizard collects all required information. Intended for the GHL Marketplace listing.

### Mode B — Platform Owner Assisted (Phase 9 MVP)
Platform Owner creates the tenant via a private `/admin/tenants/new` form. Admin then sends the new tenant a "complete your setup" email with a one-time link to the credential setup steps.

**Phase 9 ships Mode B only.** Mode A is documented here for design continuity but is not in scope for the current build.

---

## 4. Flow Overview

```
[Mode B]
Platform Owner
  → Creates tenant record (company name, slug, plan)
  → System generates tenant_id + one-time setup token
  → System emails Tenant Admin the setup link

Tenant Admin (via setup link)
  Step 1: Create admin account (name, email, password)
  Step 2: Enter GHL Location ID
  Step 3: Enter GHL Private Integration Token
  Step 4: System verifies token against GHL API
  Step 5: System seeds default checklist templates
  Step 6: Confirmation — redirect to dashboard
```

---

## 5. Data Model

### 5.1 `tenants` table

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,       -- URL-safe identifier e.g. "showtime-pools"
  name            TEXT NOT NULL,              -- Display name e.g. "Showtime Pool Service"
  plan            TEXT NOT NULL DEFAULT 'starter', -- 'starter' | 'pro' | 'enterprise'
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  -- GHL connection
  ghl_location_id TEXT,                       -- GHL sub-account location ID
  ghl_token_hash  TEXT,                       -- bcrypt hash of GHL private token (never stored plaintext)
  ghl_token_verified_at TIMESTAMPTZ,          -- when the token was last successfully verified
  ghl_webhook_secret TEXT,                    -- HMAC secret for inbound webhooks from this location

  -- Setup state machine
  onboarding_status TEXT NOT NULL DEFAULT 'pending',
    -- 'pending'       → tenant record created, setup not started
    -- 'setup_started' → admin clicked setup link
    -- 'ghl_connected' → GHL token verified
    -- 'complete'      → checklist seeded, admin account active

  setup_token         TEXT UNIQUE,            -- one-time token for the setup link (cleared after use)
  setup_token_expires TIMESTAMPTZ,            -- 72-hour expiry

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Security note:** The GHL private token is never stored in plaintext. The full token is encrypted at rest using AES-256 with a key stored in the environment (`GHL_TOKEN_ENCRYPTION_KEY`). The `ghl_token_hash` column stores a bcrypt hash used for identity verification only. The encrypted token (stored separately in `ghl_token_encrypted`) is what's used for API calls.

Revised columns for the token:

```sql
  ghl_token_encrypted TEXT,    -- AES-256-GCM encrypted token, base64 encoded
  ghl_token_iv        TEXT,    -- AES-256-GCM initialization vector, base64 encoded
  ghl_token_hash      TEXT,    -- bcrypt hash for quick "is this the same token?" checks
```

### 5.2 `users` table

Replaces the current hardcoded `DEMO_USERS` array in `src/lib/auth/config.ts`.

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,             -- bcrypt, cost factor 12
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,             -- UserRole enum values
  technician_id   UUID,                      -- FK to technicians table, only set for TECHNICIAN role
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

### 5.3 `checklist_templates` table

Stores reusable checklist templates at the tenant level. Seeded with defaults during onboarding. Tenants can add/edit their own templates later.

```sql
CREATE TABLE checklist_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,                -- e.g. "Weekly Pool Maintenance"
  service_category TEXT NOT NULL,            -- matches ServiceCategory enum
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,  -- shown as default for new WOs of this category
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  items        JSONB NOT NULL DEFAULT '[]',  -- ordered array of ChecklistTemplateItem
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_templates_tenant_id ON checklist_templates(tenant_id);
```

**`ChecklistTemplateItem` shape (JSONB array element):**

```typescript
interface ChecklistTemplateItem {
  id: string;          // stable UUID within the template
  label: string;       // displayed to technician e.g. "Check water chemistry (pH, chlorine, alkalinity)"
  required: boolean;   // if true, must be checked before marking job complete
  order: number;       // display order, 0-indexed
  notes_prompt?: string; // optional: placeholder hint for the notes field shown with this item
}
```

---

## 6. Step-by-Step Flow Detail

### Step 0 — Platform Owner Creates Tenant (Mode B)

**Route:** `POST /api/admin/tenants`  
**Auth:** `PLATFORM_OWNER` role only  
**Input:**

```typescript
{
  name: string;        // "Showtime Pool Service"
  slug: string;        // "showtime-pools" — validated: lowercase, alphanumeric + hyphens, unique
  plan: "starter" | "pro" | "enterprise";
  admin_email: string; // email address to send the setup link to
  admin_name: string;  // first admin user's display name
}
```

**System actions:**
1. Validate `slug` is unique; reject with 409 if already taken
2. Insert `tenants` row with `onboarding_status: "pending"`
3. Generate a cryptographically random 32-byte setup token (`crypto.randomBytes(32).toString("hex")`)
4. Set `setup_token` and `setup_token_expires` (72 hours from now)
5. Create a stub `users` row for the admin: `{ tenant_id, email: admin_email, name: admin_name, role: "tenant_admin", is_active: false }` — no password yet; account is inactive until Step 1
6. Send setup email to `admin_email` containing the link: `https://app.serviceops.io/setup?token={setup_token}`
7. Return `{ tenant_id, slug, onboarding_status: "pending" }` to Platform Owner

**Validation rules:**
- `slug` must match `/^[a-z0-9-]{3,40}$/`
- `admin_email` must be a valid email
- `name` required, 2–100 chars

---

### Step 1 — Admin Clicks Setup Link / Creates Password

**Route (page):** `/setup?token={setup_token}`  
**Route (API):** `POST /api/setup/account`

On page load:
- Look up tenant by `setup_token`
- If not found or expired: show "This link has expired. Contact your administrator." — do not reveal whether the token ever existed
- If found and `onboarding_status` is `"complete"`: redirect to `/login` with message "Your account is already set up."
- If valid: show the account creation form

**Form fields:**
- Name (pre-filled from admin_name, editable)
- Email (pre-filled from admin_email, read-only — this is the login identity)
- Password (min 12 chars)
- Confirm password

**API `POST /api/setup/account` — no auth required (token is the credential):**

```typescript
{
  setup_token: string;
  name: string;
  password: string;      // min 12 chars, validated server-side
  confirm_password: string;
}
```

**System actions:**
1. Re-validate token (not expired, tenant is `"pending"` or `"setup_started"`)
2. Hash password with bcrypt (cost 12)
3. Update `users` row: `{ name, password_hash, is_active: true }`
4. Update `tenants` row: `{ onboarding_status: "setup_started" }`
5. Issue a short-lived session JWT (same NextAuth flow, but scoped to setup)
6. Redirect to Step 2

**Do NOT clear the setup token yet** — it is needed as a guard for Steps 2–3. Clear it only on final completion (Step 5).

---

### Step 2 — GHL Location ID

**Route (page):** `/setup/ghl-location`  
**Auth:** Setup session from Step 1 (tenant admin, incomplete onboarding)

**Purpose:** Collect the GHL Location ID so the webhook endpoint and API calls are scoped to the correct GHL sub-account.

**Form fields:**
- GHL Location ID (text input)
- Helper text: "Find this in GHL → Settings → Business Profile → Location ID"
- A link to a short screenshot guide

**Validation:**
- GHL Location IDs are alphanumeric strings, typically 20 characters. Validate format client-side and server-side.
- No live GHL verification at this step (the token isn't set yet).

**API `POST /api/setup/ghl-location`:**

```typescript
{ ghl_location_id: string }
```

**System actions:**
1. Validate format (`/^[a-zA-Z0-9]{15,30}$/`)
2. Check that no other active tenant already has this `ghl_location_id` — if so, return 409 with "This GHL location is already connected to another ServiceOps account."
3. Update `tenants` row: `{ ghl_location_id }`
4. Redirect to Step 3

---

### Step 3 — GHL API Token

**Route (page):** `/setup/ghl-token`  
**Auth:** Setup session (must have `ghl_location_id` set — redirect back to Step 2 if missing)

**Purpose:** Collect the GHL Private Integration Token that ServiceOps will use to make outbound API calls (update opportunity status, create tasks, trigger workflows).

**Form fields:**
- GHL Private Integration Token (password input — masked)
- Helper text: "Create this in GHL → Settings → Integrations → Private Integration Tokens. Grant scopes: contacts.readonly, opportunities.write, tasks.write"
- Scope checklist shown as a visual reference

**Security handling:**
- Token is submitted over HTTPS, never logged
- Server immediately encrypts with AES-256-GCM before storage
- Raw token value is discarded after encryption; only used transiently for verification

**API `POST /api/setup/ghl-token`:**

```typescript
{ ghl_token: string }
```

**System actions:**
1. Make a live verification call to GHL API: `GET https://services.leadconnectorhq.com/locations/{ghl_location_id}` with `Authorization: Bearer {ghl_token}`
2. If the GHL call fails (401, 403, network error): return a user-friendly error — "Token verification failed. Please check that the token is correct and has the required scopes."
3. If verification succeeds:
   - Encrypt the token: `AES-256-GCM(ghl_token, GHL_TOKEN_ENCRYPTION_KEY)` → store `ghl_token_encrypted` + `ghl_token_iv`
   - Hash the token: `bcrypt(ghl_token, 12)` → store `ghl_token_hash`
   - Generate a unique `ghl_webhook_secret` for this tenant: `crypto.randomBytes(32).toString("hex")`
   - Update `tenants` row: `{ ghl_token_encrypted, ghl_token_iv, ghl_token_hash, ghl_token_verified_at: now(), ghl_webhook_secret, onboarding_status: "ghl_connected" }`
4. Redirect to Step 4

**GHL verification call details:**
- Timeout: 8 seconds
- On network error or GHL 5xx: return 503 "GHL is not responding — please try again in a moment."
- Do not retry automatically; let the user retry

---

### Step 4 — Webhook Configuration Instructions

**Route (page):** `/setup/webhook`  
**Auth:** Setup session (must be `"ghl_connected"` — guard redirect if not)

**Purpose:** Show the tenant admin how to configure the GHL webhook so GHL can send events to ServiceOps.

This step is **informational only** — no API call. The tenant configures GHL manually.

**Display:**

```
Your ServiceOps webhook endpoint:
  https://app.serviceops.io/api/ghl/webhooks

Your webhook secret (copy this exactly):
  [ghl_webhook_secret value — shown once, copy button]

In GHL:
  1. Go to Settings → Integrations → Webhooks
  2. Click "Add New Webhook"
  3. Paste the endpoint URL above
  4. Paste the secret above into the "Signing Secret" field
  5. Enable these events:
       ✓ OpportunityStatusChange
       ✓ AppointmentBooked
  6. Click Save

Once configured, click "Continue" below.
```

**Note:** The webhook secret is shown in plaintext once here (the tenant needs to copy it into GHL). After this page is dismissed, it is not retrievable from the UI — the admin would need to contact Platform Support to rotate it.

**No system action on Continue** — just advances to Step 5.

---

### Step 5 — Seed Default Checklist Templates

**Route (page):** `/setup/checklist-seed` (brief loading screen)  
**Auth:** Setup session

**Purpose:** Auto-populate the tenant's checklist template library with the ServiceOps standard pool service templates. These cover the most common service categories out of the box.

**API `POST /api/setup/seed-checklists`:**

No input required — derives `tenant_id` from session.

**System actions:**

Insert the following templates into `checklist_templates` for the new tenant:

---

#### Template 1: Weekly Pool Maintenance (`weekly_pool_maintenance`, `is_default: true`)

| # | Label | Required |
|---|---|---|
| 1 | Test water chemistry — pH (target 7.4–7.6), free chlorine (1–3 ppm), total alkalinity (80–120 ppm) | Yes |
| 2 | Add chemicals as needed and note dosages | No |
| 3 | Empty skimmer baskets | Yes |
| 4 | Empty pump basket | Yes |
| 5 | Check filter pressure — note PSI reading | Yes |
| 6 | Brush pool walls and steps | Yes |
| 7 | Vacuum pool floor | Yes |
| 8 | Skim surface debris | Yes |
| 9 | Inspect pump for leaks or unusual noise | Yes |
| 10 | Inspect all visible equipment (heater, automation, sanitizer system) | Yes |
| 11 | Check water level — add water if below skimmer | No |
| 12 | Record completed chemistry on visit note | Yes |

---

#### Template 2: Filter Cleaning (`filter_cleaning`, `is_default: true`)

| # | Label | Required |
|---|---|---|
| 1 | Turn off pump at breaker | Yes |
| 2 | Release pressure from filter | Yes |
| 3 | Remove and inspect filter element (cartridge / grids / sand bed) | Yes |
| 4 | Clean filter element per type (rinse cartridge / backwash DE grids / backwash sand) | Yes |
| 5 | Inspect for tears, cracks, or wear — note condition | Yes |
| 6 | Reassemble filter and check all fittings | Yes |
| 7 | Turn pump back on | Yes |
| 8 | Check for leaks at filter head and manifold | Yes |
| 9 | Note pre-clean vs post-clean PSI | Yes |
| 10 | Recommend replacement if element is beyond service life | No |

---

#### Template 3: Equipment Repair / Service Call (`pool_repair`, `is_default: true`)

| # | Label | Required |
|---|---|---|
| 1 | Describe reported issue (from work order description) | Yes |
| 2 | Diagnose root cause | Yes |
| 3 | Note all parts inspected | Yes |
| 4 | Note parts replaced or adjusted | Yes |
| 5 | Test repair — confirm issue is resolved | Yes |
| 6 | Test water chemistry post-repair | No |
| 7 | Document findings and work performed in technician notes | Yes |
| 8 | Flag estimate needed if additional parts or follow-up required | No |

---

#### Template 4: Pool Inspection / Diagnostic (`pool_inspection_diagnostic`, `is_default: true`)

| # | Label | Required |
|---|---|---|
| 1 | Inspect pool shell — check for cracks, stains, surface damage | Yes |
| 2 | Inspect all equipment — pump, filter, heater, sanitizer | Yes |
| 3 | Check all plumbing fittings, unions, and valves | Yes |
| 4 | Test water chemistry | Yes |
| 5 | Test all automation/control systems | No |
| 6 | Check lighting (if applicable) | No |
| 7 | Check safety equipment (fence latches, main drain covers) | Yes |
| 8 | Document all findings with condition ratings | Yes |
| 9 | Prepare written summary for owner | Yes |

---

#### Template 5: Heater Service (`heater_service`, `is_default: true`)

| # | Label | Required |
|---|---|---|
| 1 | Note heater make, model, and age | Yes |
| 2 | Check ignition and confirm heater fires | Yes |
| 3 | Inspect heat exchanger for scale or corrosion | Yes |
| 4 | Check pressure switch, high-limit switch, and thermostat | Yes |
| 5 | Inspect gas connections (gas heater) or electrical connections (heat pump) | Yes |
| 6 | Check for error codes on display | Yes |
| 7 | Confirm target temperature is reached | Yes |
| 8 | Note BTU output and any observed efficiency issues | No |

---

**After seeding:**
1. Update `tenants` row: `{ onboarding_status: "complete" }`
2. Clear the setup token: `{ setup_token: null, setup_token_expires: null }`
3. Redirect to Step 6

---

### Step 6 — Completion

**Route (page):** `/setup/complete`  
**Auth:** Setup session (converts to a full session at this point)

**Display:**

```
You're all set, [Admin Name].

Your ServiceOps account is ready:
  ✓ Admin account created
  ✓ GHL location connected (Location ID: xxx...)
  ✓ 5 checklist templates loaded
  ✓ Webhook endpoint configured

Next steps:
  → Add your properties (customer service addresses)
  → Add your technicians
  → Create your first work order

[Go to Dashboard →]
```

Clicking "Go to Dashboard" navigates to `/dashboard/overview` and destroys the setup-scoped session state, issuing a full NextAuth session.

---

## 7. Setup Session / Auth Model

During onboarding (Steps 1–6), the user is not in a full NextAuth session. Instead:

- After Step 1, issue a short-lived **setup JWT** (1-hour expiry) stored in an httpOnly cookie named `so_setup_token`
- The setup JWT payload: `{ setup_token, tenant_id, step: "account_created" }`
- Each setup route middleware validates: (a) setup JWT is present and valid, (b) tenant's `onboarding_status` matches the expected step, (c) setup_token is not expired
- On completion, the setup JWT is cleared and a standard NextAuth session is issued
- If the admin closes the browser mid-setup: they can re-open the original setup link as long as the 72-hour window has not passed — it will resume from where they left off (detected by `onboarding_status`)

---

## 8. Route Protection

All setup routes must be protected with a setup middleware layer (separate from the main NextAuth middleware):

```
/setup                    → requires valid setup_token query param (before login)
/setup/ghl-location       → requires setup JWT + onboarding_status in ["setup_started", "ghl_connected", "complete"]
/setup/ghl-token          → requires setup JWT + ghl_location_id set
/setup/webhook            → requires setup JWT + onboarding_status == "ghl_connected"
/setup/checklist-seed     → requires setup JWT + onboarding_status == "ghl_connected"
/setup/complete           → requires setup JWT + onboarding_status == "complete"
```

If a step's preconditions are not met, redirect the user to the earliest incomplete step rather than showing an error.

---

## 9. API Routes Summary

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/admin/tenants` | PLATFORM_OWNER | Create tenant + send setup email |
| GET | `/api/admin/tenants` | PLATFORM_OWNER | List all tenants + onboarding status |
| POST | `/api/setup/account` | Setup token | Create admin password |
| POST | `/api/setup/ghl-location` | Setup JWT | Save + validate GHL Location ID |
| POST | `/api/setup/ghl-token` | Setup JWT | Encrypt + verify GHL token |
| POST | `/api/setup/seed-checklists` | Setup JWT | Seed default templates |
| GET | `/api/setup/status` | Setup JWT | Return current step for resume logic |

---

## 10. Pages Summary

| Route | Description |
|---|---|
| `/admin/tenants` | Platform Owner — tenant list + create button |
| `/admin/tenants/new` | Platform Owner — create tenant form |
| `/setup` | Entry point — validates token, shows account creation form |
| `/setup/ghl-location` | GHL Location ID form |
| `/setup/ghl-token` | GHL Token form with live verification |
| `/setup/webhook` | Webhook instructions + secret display |
| `/setup/checklist-seed` | Loading screen while templates are seeded |
| `/setup/complete` | Success screen + next steps |

---

## 11. Error States

| Scenario | Behavior |
|---|---|
| Setup link expired (>72 hrs) | Show "Link expired — contact your administrator." No retry link on this page. |
| Setup link already used | Show "Account already set up — sign in instead." with link to `/login` |
| GHL Location ID already in use | Return 409 with explanatory message; let user correct the ID |
| GHL token verification fails | Return 400 with "Token invalid or missing required scopes." — retry allowed |
| GHL API is unreachable | Return 503 with "GHL is not responding — please try again in a moment." — retry allowed |
| Checklist seeding fails | Log the error; show "Setup is almost done — contact support to complete setup." Do not leave tenant in broken state: mark `onboarding_status: "ghl_connected"` and allow retry via the setup flow |
| Admin loses session mid-setup | Re-entering the original setup link (if not expired) resumes from `onboarding_status` |

---

## 12. Security Checklist

- [ ] GHL token never logged anywhere (including error logs)
- [ ] GHL token encrypted at rest with AES-256-GCM; key in env only
- [ ] Setup token is single-use — cleared on completion
- [ ] Setup token has 72-hour expiry enforced server-side
- [ ] Setup token lookup uses constant-time comparison (`crypto.timingSafeEqual`)
- [ ] `/api/admin/tenants` requires `PLATFORM_OWNER` role — no tenant admin can access
- [ ] `ghl_webhook_secret` per tenant — not shared across tenants
- [ ] Webhook secret shown once only; rotation requires Platform Support
- [ ] All setup API routes validate `tenant_id` from JWT — no tenant can affect another tenant's setup
- [ ] GHL Location ID uniqueness enforced at DB level (`UNIQUE` constraint) and at API layer
- [ ] Bcrypt cost factor 12 on all passwords

---

## 13. Out of Scope for This Spec

- **Self-service signup page** (`/signup`) — Mode A, not in Phase 9
- **Stripe billing integration** — deferred
- **White-label theming** — deferred
- **Tenant suspension / deletion flow** — deferred
- **GHL OAuth 2.0** — Private Integration Token is used for Phase 9; OAuth is for GHL Marketplace listing (future)
- **Multi-admin invitations** — Phase 9 seeds one admin; additional users are added manually post-onboarding
- **Webhook rotation UI** — admin contacts Platform Support; self-service rotation is future scope

---

## 14. Build Order

When this spec is approved and ready to implement:

1. Write and run DB migrations: `tenants`, `users`, `checklist_templates` tables
2. Update `src/lib/auth/config.ts` to look up users from DB instead of hardcoded array
3. Implement `/api/admin/tenants` (POST + GET)
4. Implement setup JWT middleware (`src/middleware/setup-auth.ts`)
5. Implement setup API routes (account → ghl-location → ghl-token → seed-checklists)
6. Build setup wizard pages (`/setup/*`)
7. Build `/admin/tenants` and `/admin/tenants/new` pages
8. Integration test: full onboarding flow end-to-end with a test GHL sandbox location
9. Security review: token handling, encryption, log scanning
10. QA: test expired links, duplicate slugs, GHL token failures, resume-from-step logic

---

*Last updated: 2026-05-07*
