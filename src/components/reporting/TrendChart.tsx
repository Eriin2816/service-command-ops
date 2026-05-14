'use client'

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { TrendPoint } from '@/types/reporting'

interface TrendChartProps {
  data: TrendPoint[]
  color?: string
  height?: number
  showGrid?: boolean
  showAxis?: boolean
  format?: 'number' | 'currency'
  loading?: boolean
}

interface TooltipPayloadEntry {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  valueFmt: 'number' | 'currency'
}

function CustomTooltip({ active, payload, label, valueFmt }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const raw = payload[0].value
  const display = valueFmt === 'currency'
    ? '$' + (raw / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : raw.toLocaleString('en-US')
  let dateLabel = label ?? ''
  try { dateLabel = format(parseISO(label ?? ''), 'MMM d, yyyy') } catch { /* keep raw */ }
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3">
      <div className="font-mono text-[11px] text-[#94A3B8]">{dateLabel}</div>
      <div className="font-bold text-[#0F172A] text-sm">{display}</div>
    </div>
  )
}

export function TrendChart({
  data,
  color = '#06B6D4',
  height = 120,
  showGrid = false,
  showAxis = false,
  format: valueFmt = 'number',
  loading = false,
}: TrendChartProps) {
  if (loading) {
    return (
      <div
        className="bg-[#F4F7FB] rounded-lg animate-pulse w-full"
        style={{ height }}
      />
    )
  }

  const gradientId = `grad-${color.replace('#', '')}`

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />}

          <XAxis
            dataKey="date"
            hide={!showAxis}
            tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#94A3B8' }}
            tickFormatter={(v: string) => {
              try { return format(parseISO(v), 'MMM d') } catch { return v }
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            hide={!showAxis}
            tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <Tooltip content={<CustomTooltip valueFmt={valueFmt} />} />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendChart
