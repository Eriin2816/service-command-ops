'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { SourceBreakdownItem } from '@/types/reporting'

type MetricKey = 'leads' | 'bookings' | 'wonRevenue'

interface SourceBreakdownProps {
  data: SourceBreakdownItem[]
  metric?: MetricKey
  loading?: boolean
}

function fmtMetric(item: SourceBreakdownItem, metric: MetricKey): string {
  if (metric === 'wonRevenue') {
    return '$' + (item.wonRevenue / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return String(item[metric])
}

function getMetricValue(item: SourceBreakdownItem, metric: MetricKey): number {
  if (metric === 'wonRevenue') return item.wonRevenue
  return item[metric]
}

interface TooltipPayloadEntry {
  name: string
  value: number
  payload: SourceBreakdownItem & { metricValue: number }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  metric: MetricKey
}

function CustomTooltip({ active, payload, metric }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const display = metric === 'wonRevenue'
    ? '$' + (item.metricValue / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : String(item.metricValue)
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3">
      <div className="font-mono text-[11px] text-[#94A3B8]">{item.source}</div>
      <div className="font-bold text-[#0F172A] text-sm">{display}</div>
    </div>
  )
}

export function SourceBreakdown({
  data,
  metric = 'leads',
  loading = false,
}: SourceBreakdownProps) {
  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="w-48 h-48 bg-[#E2E8F0] rounded-full animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          {[80, 65, 50, 40, 30].map((w, i) => (
            <div key={i} className="h-8 bg-[#E2E8F0] rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric))
  const total = sorted.reduce((s, d) => s + getMetricValue(d, metric), 0)
  const chartData = sorted.map(item => ({ ...item, metricValue: getMetricValue(item, metric) }))
  const metricLabel = metric === 'wonRevenue' ? 'Won Revenue' : metric === 'bookings' ? 'Bookings' : 'Leads'

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="flex-shrink-0 w-full sm:w-48" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={3}
              dataKey="metricValue"
              nameKey="source"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip metric={metric} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="-mt-32 flex flex-col items-center pointer-events-none select-none">
          <div className="font-bold text-2xl text-[#0F172A]">
            {metric === 'wonRevenue'
              ? '$' + (total / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
              : total.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wide">Total {metricLabel}</div>
        </div>
      </div>

      <div className="flex-1 space-y-2 pt-1">
        {sorted.map(item => {
          const val = getMetricValue(item, metric)
          const pct = total > 0 ? (val / total) * 100 : 0
          return (
            <div key={item.source} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-[#475569]">{item.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-[#0F172A]">{fmtMetric(item, metric)}</span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: item.color + '20' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, borderLeft: `3px solid ${item.color}`, backgroundColor: item.color + '40' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SourceBreakdown
