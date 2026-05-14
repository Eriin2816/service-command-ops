/**
 * Reporting service — abstraction layer between API routes and data sources.
 *
 * When USE_MOCK_DATA is true (no GHL token, or APP_ENV=development),
 * returns realistic mock data with a simulated network delay.
 *
 * When USE_MOCK_DATA is false, this is where live GHL API calls will
 * be implemented in Phase 2 once credentials are confirmed with the client.
 */

import {
  OwnerPerformanceData,
  VAPerformanceData,
  MarketingPerformanceData,
  ReportingFilters,
} from '@/types/reporting'
import {
  mockOwnerPerformance,
  mockVAPerformance,
  mockMarketingPerformance,
  USE_MOCK_DATA,
} from '@/config/reporting-mock-data'

const GHL_BASE    = process.env.GHL_API_BASE_URL ?? 'https://services.leadconnectorhq.com'
const GHL_TOKEN   = process.env.GHL_PRIVATE_INTEGRATION_TOKEN
const GHL_LOCATION = process.env.GHL_LOCATION_ID

// ─── Safe GHL fetch (server-side only) ───────────────────────────────────────
// Uses Next.js fetch with a 5-minute revalidate cache so reporting endpoints
// don't hammer GHL on every page load.

async function ghlGet(path: string): Promise<unknown> {
  if (!GHL_TOKEN) {
    throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN not set')
  }
  const res = await fetch(`${GHL_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    next: { revalidate: 300 },   // 5-min cache
  })
  if (!res.ok) {
    throw new Error(`GHL API error: ${res.status} ${path}`)
  }
  return res.json()
}

// Suppress unused-variable warning until live implementation is added.
void ghlGet
void GHL_LOCATION

// ─── Owner Performance ────────────────────────────────────────────────────────

export async function getOwnerPerformance(
  filters: ReportingFilters,
  _tenantId: string
): Promise<OwnerPerformanceData> {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 400))
    return {
      ...mockOwnerPerformance,
      filters,
      generatedAt: new Date().toISOString(),
    }
  }

  // ── LIVE GHL implementation (Phase 2) ────────────────────────────────────
  // TODO: Replace with real GHL API calls once credentials are confirmed.
  //
  // Suggested endpoints:
  //   GET /contacts/?locationId={id}&startDate=&endDate=
  //   GET /opportunities/?locationId={id}&startDate=&endDate=
  //   GET /calendars/events/?locationId={id}&startDate=&endDate=
  //
  // Map response → OwnerPerformanceData using field mappings in
  // integration-blueprint/ghl-opportunity-mapping.md
  //
  // Fall through to mock on any live failure:
  console.warn('[reporting-service] GHL live not implemented — using mock.')
  return { ...mockOwnerPerformance, filters, generatedAt: new Date().toISOString() }
}

// ─── VA Performance ───────────────────────────────────────────────────────────

export async function getVAPerformance(
  filters: ReportingFilters,
  _tenantId: string
): Promise<VAPerformanceData> {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 400))
    return {
      ...mockVAPerformance,
      filters,
      generatedAt: new Date().toISOString(),
    }
  }

  // ── LIVE GHL implementation (Phase 2) ────────────────────────────────────
  // TODO: Replace with real GHL API calls once credentials are confirmed.
  //
  // Suggested endpoints:
  //   GET /users/?locationId={id}           — team member list
  //   GET /conversations/?assignedTo={userId} — per-VA conversation counts
  //   GET /tasks/?assignedTo={userId}        — task completion per VA
  //
  console.warn('[reporting-service] GHL live not implemented — using mock.')
  return { ...mockVAPerformance, filters, generatedAt: new Date().toISOString() }
}

// ─── Marketing Performance ────────────────────────────────────────────────────

export async function getMarketingPerformance(
  filters: ReportingFilters,
  _tenantId: string
): Promise<MarketingPerformanceData> {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 400))
    return {
      ...mockMarketingPerformance,
      filters,
      generatedAt: new Date().toISOString(),
    }
  }

  // ── LIVE GHL implementation (Phase 2) ────────────────────────────────────
  // TODO: Replace with real GHL API calls once credentials are confirmed.
  //
  // Suggested endpoints:
  //   GET /contacts/?locationId={id}&source=  — contacts by UTM source
  //   GET /opportunities/?locationId={id}     — group by source custom field
  //
  console.warn('[reporting-service] GHL live not implemented — using mock.')
  return { ...mockMarketingPerformance, filters, generatedAt: new Date().toISOString() }
}
