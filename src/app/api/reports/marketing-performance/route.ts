import { type NextRequest, NextResponse } from 'next/server'
import { requirePermission, getTenantId } from '@/lib/auth/api-auth'
import { getMarketingPerformance } from '@/lib/ghl/reporting-service'
import { defaultDateRange } from '@/config/reporting-mock-data'
import type { ReportingFilters, ReportingApiResponse, MarketingPerformanceData, DateRangePreset } from '@/types/reporting'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requirePermission('canViewReports')
  if (!auth.ok) return auth.response

  const tenantId = getTenantId(auth.session)
  const { searchParams } = req.nextUrl

  const filters: ReportingFilters = {
    dateRange: {
      preset: (searchParams.get('preset') ?? 'this_month') as DateRangePreset,
      from: searchParams.get('from') ?? defaultDateRange.from,
      to:   searchParams.get('to')   ?? defaultDateRange.to,
    },
    userId:   searchParams.get('userId')   ?? undefined,
    source:   searchParams.get('source')   ?? undefined,
    pipeline: searchParams.get('pipeline') ?? undefined,
    campaign: searchParams.get('campaign') ?? undefined,
  }

  let data: MarketingPerformanceData
  try {
    data = await getMarketingPerformance(filters, tenantId)
  } catch (err) {
    console.error('[api] GET /api/reports/marketing-performance failed:', err)
    const body: ReportingApiResponse<MarketingPerformanceData> = {
      data: null, error: 'Failed to load reporting data', success: false,
    }
    return NextResponse.json(body, { status: 500 })
  }

  const body: ReportingApiResponse<MarketingPerformanceData> = {
    data, error: null, success: true,
  }
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
