# GHL Reporting Live Data Setup

## Current State
All reporting data uses mock/demo data.
The mock data is realistic and matches the exact data contract that live GHL data will use.
A "DEMO DATA" amber badge appears on the Reports sidebar item and on each report page
whenever `NEXT_PUBLIC_REPORTING_MODE=mock`.

---

## How to Switch to Live GHL Data

### Step 1 — Confirm environment variables

Set these in your Vercel dashboard (or `.env.local` for local dev):

```
GHL_API_BASE_URL=https://services.leadconnectorhq.com
GHL_LOCATION_ID=[your GHL location ID]
GHL_PRIVATE_INTEGRATION_TOKEN=[your private integration token]
NEXT_PUBLIC_REPORTING_MODE=live
```

### Step 2 — What USE_MOCK_DATA controls

In `src/config/reporting-mock-data.ts`:

```ts
export const USE_MOCK_DATA =
  process.env.GHL_PRIVATE_INTEGRATION_TOKEN === undefined ||
  process.env.GHL_PRIVATE_INTEGRATION_TOKEN === '' ||
  process.env.APP_ENV === 'development'
```

When `GHL_PRIVATE_INTEGRATION_TOKEN` is set and `APP_ENV` is not `development`,
mock data is automatically disabled. No code change required.

### Step 3 — GHL API endpoints to implement

For each metric, the suggested GHL API endpoints are:

**Contacts / Leads**
```
GET /contacts/?locationId={id}&startAfter={epochMs}
```
- Filter by `dateAdded` for date range
- `startAfter` + `startAfterId` for pagination
- Map `source` field to lead source attribution

**Opportunities / Pipeline**
```
GET /opportunities/search?location_id={id}&startAfter={date}&endBefore={date}
```
- Filter by `createdAt` for date range
- Group by `status` for funnel stages
- Group by `pipelineId` for pipeline breakdown
- `monetaryValue` field = pipeline/won revenue (in dollars; multiply × 100 for our cents format)

**Calendar Appointments**
```
GET /calendars/events?locationId={id}&startTime={iso}&endTime={iso}
```
- `status` field: `booked`, `confirmed`, `showed`, `noshow`, `cancelled`
- Join to contacts via `contactId` for lead attribution

**Users / Team**
```
GET /users/?locationId={id}
```
- Returns all team members with `id`, `name`, `email`
- Use `id` to match `GHL_USER_TO_TECHNICIAN` env var mapping

**Conversations**
```
GET /conversations/?locationId={id}&assignedTo={userId}&startAfterDate={date}
```
- Count per assigned user for VA conversation metrics
- `lastMessageDate` for activity filtering

### Step 4 — Update reporting-service.ts

Replace the `// TODO` comment blocks in each function in `src/lib/ghl/reporting-service.ts`
with real GHL API calls using the `ghlGet(path)` helper already defined in that file.

Map GHL field names to our data contract using:
- `integration-blueprint/ghl-contact-mapping.md`
- `integration-blueprint/ghl-opportunity-mapping.md`

Example pattern for owner performance:
```ts
// live path
const contacts = await ghlGet(`/contacts/?locationId=${GHL_LOCATION}&...`)
const opps     = await ghlGet(`/opportunities/search?location_id=${GHL_LOCATION}&...`)
// ... map to OwnerPerformanceData shape
return { summary: { ... }, deltas: { ... }, trends: { ... }, ... }
```

### Step 5 — Caching

The API routes already set:
```
Cache-Control: private, max-age=300
```

The internal `ghlGet()` helper uses:
```ts
next: { revalidate: 300 }  // 5-min Next.js fetch cache
```

For production under high load, consider Redis via Upstash to reduce GHL API calls
(GHL rate limit: ~100 req/min per location).

---

## GHL Rate Limits

| Endpoint | Rate limit | Notes |
|----------|-----------|-------|
| Contacts | 100/min | Paginate with `startAfter` |
| Opportunities | 100/min | Use date filters to narrow |
| Calendar events | 100/min | Always specify startTime/endTime |
| Users | 100/min | Cache aggressively — rarely changes |

Never query on every page load. The 5-minute cache at both the fetch and HTTP layer
means each endpoint is hit at most once every 5 minutes per deployment.

---

## Testing Live Data

1. Set env vars in `.env.local`
2. Restart dev server (`npm run dev`)
3. Navigate to `/dashboard/reports/owner`
4. The **DEMO DATA** badge should disappear
5. A green **LIVE** badge with pulse dot should appear
6. Real data from GHL should populate all cards and charts

If data looks wrong, check:
- `GHL_LOCATION_ID` matches the correct sub-account
- `GHL_PRIVATE_INTEGRATION_TOKEN` has read access to Contacts, Opportunities, Calendars, Users
- `NEXT_PUBLIC_REPORTING_MODE` is set to `live` (controls badge display only — not data source)

---

## Data Contract Reference

All reporting data uses USD **cents** internally (e.g. `1260000` = $12,600).
The `formatValue('currency')` helper in `MetricCard.tsx` divides by 100 before display.
GHL `monetaryValue` is in **dollars** — multiply × 100 when mapping to our types.

Type definitions: `src/types/reporting.ts`
Mock data reference: `src/config/reporting-mock-data.ts`
Service layer: `src/lib/ghl/reporting-service.ts`
