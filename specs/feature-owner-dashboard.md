# Feature: Owner Dashboard — Shared Error Handling Pattern

## Overview
All dashboard pages use a shared set of UI primitives and a data-fetching hook
so that consistent loading, error, and empty states come for free on every
future page.

---

## Shared UI Components (`src/components/ui/`)

### `ErrorState`
Inline error banner with an optional retry button. Two variants:

```tsx
// Inline — used inside a card or table area
<ErrorState message="Failed to load work orders" onRetry={retry} />

// Full-page — used when the entire page content depends on the failed fetch
<ErrorStateFull message="Failed to load dashboard data" onRetry={retry} />
```

### `EmptyState`
Centered icon + title + optional description, used when data loads successfully
but the list is empty (or a page has no live data yet).

```tsx
<EmptyState
  icon={ClipboardList}
  title="No work orders yet"
  description="Create one to get started."
/>
```

### `LoadingState` exports
- `LoadingTableRows` — drop-in replacement inside `<TableBody>` for skeleton rows
- `LoadingCard` — stat card skeleton
- `LoadingBarRow` — bar chart row skeleton

---

## Data-Fetching Hook (`src/lib/utils/useApiQuery.ts`)

```ts
const { data, error, loading, retry } = useApiQuery<T>(url);
```

**Contract:**
- Auto-fetches on mount and re-fetches whenever `url` changes.
- Expects API responses of shape `{ data: T }` or `{ error: string }`.
- `retry` re-runs the fetch immediately (use in error state buttons).
- For multiple fetches on one page, call the hook twice and combine states.

**Example — single fetch:**
```tsx
const { data: workOrders, error, loading, retry } = useApiQuery<WorkOrderWithRelations[]>("/api/work-orders");
if (error) return <ErrorState message={error} onRetry={retry} />;
```

**Example — two fetches, combined state:**
```tsx
const summaryQuery = useApiQuery<DashboardSummary>("/api/reports/summary");
const woQuery      = useApiQuery<WorkOrderWithRelations[]>("/api/work-orders");

const loading = summaryQuery.loading || woQuery.loading;
const error   = summaryQuery.error ?? woQuery.error;
const retry   = () => { summaryQuery.retry(); woQuery.retry(); };
```

**Example — dynamic URL (date range picker):**
```tsx
const url = useMemo(
  () => `/api/reports/range?date_from=${range.from}&date_to=${range.to}`,
  [range]
);
const { data: report, error, loading, retry } = useApiQuery<RangeReport>(url);
```
URL change triggers an automatic re-fetch — no manual `useEffect` needed.

---

## API Route Contract

All API routes must follow this response shape so `useApiQuery` can parse them:

| Scenario | HTTP status | Body |
|---|---|---|
| Success with data | 200 | `{ data: T }` |
| Success, no rows | 200 | `{ data: [] }` or `{ data: emptyObject }` |
| DB error (non-fatal) | 200 | `{ data: [] }` — logged server-side |
| Validation error | 400 / 422 | `{ error: string, ... }` |
| Auth error | 401 / 403 | `{ error: string }` |

DB errors return 200 with empty data so the UI always renders an empty state
rather than a red error page. The real error is printed via `console.error` in
the API route for Vercel runtime log inspection.

---

## Pages Using This Pattern

| Page | Hook calls | Components used |
|---|---|---|
| Overview | `useApiQuery` × 2 (summary + work-orders) | `ErrorStateFull`, `LoadingCard`, `LoadingBarRow` |
| Work Orders | `useApiQuery` × 1 | `ErrorState`, `LoadingTableRows` |
| Properties | `useApiQuery` × 1 | `ErrorState`, `LoadingTableRows` |
| Reports | `useApiQuery` × 1 (dynamic URL) | `ErrorState` |
| Technicians | — | `EmptyState` |
| Visits | — | `EmptyState` |
| Estimates | — | `EmptyState` |

---

## Adding a New Dashboard Page

1. Call `useApiQuery<YourType>("/api/your-endpoint")`.
2. Render `<ErrorState message={error} onRetry={retry} />` on error.
3. Render `<LoadingTableRows />` or `<LoadingCard />` while loading.
4. Render `<EmptyState />` when `data` is empty.
5. Add a test case to `qa/manual-test-plan.md`.
