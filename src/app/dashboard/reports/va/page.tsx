'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Clock, Calendar, CheckCircle, TrendingUp } from 'lucide-react'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import {
  ReportingTabs, DateRangeFilter, MetricCard,
  TrendChart, PerformanceTable, EmptyState,
  LoadingSkeleton, ErrorState,
} from '@/components/reporting'
import { defaultDateRange } from '@/config/reporting-mock-data'
import type {
  ReportingFilters, ReportingApiResponse, VAPerformanceData,
} from '@/types/reporting'

export default function VAReportsPage() {
  const router = useRouter()

  const [filters, setFilters] = useState<ReportingFilters>({
    dateRange: defaultDateRange,
  })
  const [data, setData] = useState<VAPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        preset: filters.dateRange.preset,
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.userId   && { userId:   filters.userId }),
        ...(filters.pipeline && { pipeline: filters.pipeline }),
      })
      const res = await fetch(`/api/reports/va-performance?${params}`)
      const json: ReportingApiResponse<VAPerformanceData> = await res.json()
      if (!json.success || !json.data) throw new Error(json.error ?? 'Failed to load data')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reporting data')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { void fetchData() }, [fetchData])

  function handleDateChange(dateRange: ReportingFilters['dateRange']) {
    setFilters(prev => ({ ...prev, dateRange }))
  }

  function DataSourceBadge() {
    if (!data) return null
    if (data.dataSource === 'mock') {
      return (
        <span
          className="font-mono text-[10px] px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700"
          title="Connect GHL to see live data"
        >
          DEMO DATA
        </span>
      )
    }
    if (data.dataSource === 'live') {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      )
    }
    return (
      <span className="font-mono text-[10px] px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
        CACHED
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Reports', href: '/dashboard/reports' }, { label: 'VA Performance' }]} className="mb-2" />
          <h2 className="font-display text-[26px] font-bold text-slate-900 leading-tight">VA Performance</h2>
          <p className="mt-1 text-sm text-slate-500">Team response times and booking rates</p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <DataSourceBadge />
          {data && (
            <span className="font-mono text-[11px] text-[#94A3B8]">
              {filters.dateRange.from} – {filters.dateRange.to}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ReportingTabs />

      {/* Filters */}
      <DateRangeFilter value={filters.dateRange} onChange={handleDateChange} loading={loading} />

      {/* Error */}
      {error && <ErrorState message={error} onRetry={fetchData} />}

      {/* Loading */}
      {loading && !error && <LoadingSkeleton variant="full" />}

      {/* Content */}
      {!loading && !error && data && (
        <div className="space-y-5">
          {/* Row 1 — Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Total Assigned"
              value={data.summary.totalLeadsAssigned}
              accent="blue"
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              label="Avg Response Time"
              value={data.summary.avgFirstResponseTime}
              format="time"
              accent="amber"
              icon={<Clock className="w-4 h-4" />}
            />
            <MetricCard
              label="Avg Booking Rate"
              value={data.summary.avgBookingRate}
              format="percent"
              accent="emerald"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <MetricCard
              label="Total Booked"
              value={data.summary.totalAppointmentsBooked}
              accent="cyan"
              icon={<Calendar className="w-4 h-4" />}
            />
            <MetricCard
              label="Avg SLA Compliance"
              value={data.summary.avgSlaCompliance}
              format="percent"
              accent="purple"
              icon={<CheckCircle className="w-4 h-4" />}
            />
          </div>

          {/* Row 2 — Trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8] block mb-4">
                Response Time Trend (min)
              </span>
              <TrendChart
                data={data.trends.responseTime}
                color="#F59E0B"
                height={160}
                showGrid
                showAxis
              />
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8] block mb-4">
                Booking Rate Trend (%)
              </span>
              <TrendChart
                data={data.trends.bookingRate}
                color="#10B981"
                height={160}
                showGrid
                showAxis
              />
            </div>
          </div>

          {/* Row 3 — Team table or empty state */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8]">
                VA Breakdown
              </span>
            </div>
            {data.team.length === 0 ? (
              <EmptyState
                title="No VA data yet"
                message="Add technicians and assign leads to see performance metrics here."
                icon="data"
                action={{
                  label: 'Add Technician',
                  onClick: () => router.push('/dashboard/technicians'),
                }}
              />
            ) : (
              <PerformanceTable rows={data.team} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
