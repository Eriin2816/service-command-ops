'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Calendar, TrendingUp, DollarSign,
  Eye, Phone, Zap, Target,
} from 'lucide-react'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import {
  ReportingTabs, DateRangeFilter, MetricCard,
  TrendChart, ConversionFunnel, SourceBreakdown,
  LoadingSkeleton, ErrorState,
} from '@/components/reporting'
import { defaultDateRange } from '@/config/reporting-mock-data'
import type {
  ReportingFilters, ReportingApiResponse,
  OwnerPerformanceData, TrendPoint,
} from '@/types/reporting'

type TrendKey = 'leads' | 'appointments' | 'revenue'

export default function OwnerReportsPage() {
  const router = useRouter()
  void router

  const [filters, setFilters] = useState<ReportingFilters>({
    dateRange: defaultDateRange,
  })
  const [data, setData] = useState<OwnerPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTrend, setActiveTrend] = useState<TrendKey>('leads')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        preset: filters.dateRange.preset,
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.userId   && { userId:   filters.userId }),
        ...(filters.source   && { source:   filters.source }),
        ...(filters.pipeline && { pipeline: filters.pipeline }),
      })
      const res = await fetch(`/api/reports/owner-performance?${params}`)
      const json: ReportingApiResponse<OwnerPerformanceData> = await res.json()
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

  const trendData: Record<TrendKey, TrendPoint[]> = data
    ? { leads: data.trends.leads, appointments: data.trends.appointments, revenue: data.trends.revenue }
    : { leads: [], appointments: [], revenue: [] }

  const trendColor: Record<TrendKey, string> = {
    leads: '#3B82F6',
    appointments: '#06B6D4',
    revenue: '#8B5CF6',
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
          <Breadcrumb items={[{ label: 'Reports', href: '/dashboard/reports' }, { label: 'Owner Performance' }]} className="mb-2" />
          <h2 className="font-display text-[26px] font-bold text-slate-900 leading-tight">Owner Performance</h2>
          <p className="mt-1 text-sm text-slate-500">Revenue, leads, and conversion metrics</p>
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
          {/* Row 1 — Primary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Leads"
              value={data.summary.totalLeads}
              delta={data.deltas.totalLeads}
              accent="blue"
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              label="Appointments Booked"
              value={data.summary.bookedAppointments}
              delta={data.deltas.bookedAppointments}
              accent="cyan"
              icon={<Calendar className="w-4 h-4" />}
            />
            <MetricCard
              label="Close Rate"
              value={data.summary.closeRate}
              format="percent"
              delta={data.deltas.closeRate}
              accent="emerald"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <MetricCard
              label="Won Revenue"
              value={data.summary.wonRevenue}
              format="currency"
              delta={data.deltas.wonRevenue}
              accent="purple"
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>

          {/* Row 2 — Secondary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Show Rate"
              value={data.summary.showRate}
              format="percent"
              accent="emerald"
              icon={<Eye className="w-4 h-4" />}
            />
            <MetricCard
              label="Pipeline Value"
              value={data.summary.pipelineValue}
              format="currency"
              delta={data.deltas.pipelineValue}
              accent="blue"
              icon={<Target className="w-4 h-4" />}
            />
            <MetricCard
              label="Speed to Lead"
              value={data.summary.avgSpeedToLead}
              format="time"
              accent="amber"
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              label="Lead → Booking"
              value={data.summary.leadToBookingRate}
              format="percent"
              accent="cyan"
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </div>

          {/* Row 3 — Trend + Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8]">
                  Leads &amp; Appointments Trend
                </span>
                <div className="flex gap-1">
                  {(['leads', 'appointments', 'revenue'] as TrendKey[]).map(k => (
                    <button
                      key={k}
                      onClick={() => setActiveTrend(k)}
                      className={[
                        'font-mono text-[10px] px-2.5 py-1 rounded-full border capitalize transition-all duration-150',
                        activeTrend === k
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] font-semibold'
                          : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]',
                      ].join(' ')}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <TrendChart
                data={trendData[activeTrend]}
                color={trendColor[activeTrend]}
                height={180}
                showGrid
                showAxis
                format={activeTrend === 'revenue' ? 'currency' : 'number'}
              />
            </div>

            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8] block mb-4">
                Conversion Funnel
              </span>
              <ConversionFunnel stages={data.conversionFunnel} />
            </div>
          </div>

          {/* Row 4 — Revenue by Source */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
            <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8] block mb-4">
              Revenue by Source
            </span>
            <SourceBreakdown data={data.revenueBySource} metric="wonRevenue" />
          </div>

          {/* Row 5 — Miss metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Missed Leads"
              value={data.summary.missedLeads}
              accent="red"
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              label="Missed Calls"
              value={data.summary.missedCalls}
              accent="red"
              icon={<Phone className="w-4 h-4" />}
            />
            <MetricCard
              label="Avg Speed to Lead"
              value={data.summary.avgSpeedToLead}
              format="time"
              accent="amber"
              icon={<Zap className="w-4 h-4" />}
            />
          </div>
        </div>
      )}
    </div>
  )
}
