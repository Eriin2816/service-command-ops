'use client'

import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
} from 'date-fns'
import type { DateRange, DateRangePreset } from '@/types/reporting'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  loading?: boolean
}

const PRESETS: { label: string; id: DateRangePreset }[] = [
  { label: 'Today',       id: 'today' },
  { label: 'Yesterday',   id: 'yesterday' },
  { label: 'This Week',   id: 'this_week' },
  { label: 'Last Week',   id: 'last_week' },
  { label: 'This Month',  id: 'this_month' },
  { label: 'Last Month',  id: 'last_month' },
  { label: 'Last 30 Days', id: 'last_30_days' },
  { label: 'Last 90 Days', id: 'last_90_days' },
]

function presetToRange(preset: DateRangePreset): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) }
    case 'yesterday': {
      const y = subDays(today, 1)
      return { from: fmt(y), to: fmt(y) }
    }
    case 'this_week':
      return { from: fmt(startOfWeek(today, { weekStartsOn: 1 })), to: fmt(today) }
    case 'last_week': {
      const s = startOfWeek(subDays(today, 7), { weekStartsOn: 1 })
      return { from: fmt(s), to: fmt(endOfWeek(s, { weekStartsOn: 1 })) }
    }
    case 'this_month':
      return { from: fmt(startOfMonth(today)), to: fmt(today) }
    case 'last_month': {
      const lm = subMonths(today, 1)
      return { from: fmt(startOfMonth(lm)), to: fmt(endOfMonth(lm)) }
    }
    case 'last_30_days':
      return { from: fmt(subDays(today, 29)), to: fmt(today) }
    case 'last_90_days':
      return { from: fmt(subDays(today, 89)), to: fmt(today) }
    default:
      return { from: fmt(today), to: fmt(today) }
  }
}

function fmtDisplay(from: string, to: string): string {
  try {
    const f = parseISO(from)
    const t = parseISO(to)
    if (from === to) return format(f, 'MMM d, yyyy')
    return `${format(f, 'MMM d')} – ${format(t, 'MMM d, yyyy')}`
  } catch {
    return `${from} – ${to}`
  }
}

export function DateRangeFilter({ value, onChange, loading = false }: DateRangeFilterProps) {
  function handlePreset(preset: DateRangePreset) {
    if (preset === 'custom') return
    const { from, to } = presetToRange(preset)
    onChange({ preset, from, to })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {PRESETS.map(p => {
          const active = value.preset === p.id
          return (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              disabled={loading}
              className={[
                'font-mono text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-all duration-150 border',
                active
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] font-semibold'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]',
                loading ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {value.preset === 'custom' ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from}
            onChange={e => onChange({ ...value, from: e.target.value })}
            className="font-mono text-[11px] border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[#475569] focus:outline-none focus:border-[#BFDBFE]"
          />
          <span className="text-[#94A3B8] text-xs">–</span>
          <input
            type="date"
            value={value.to}
            onChange={e => onChange({ ...value, to: e.target.value })}
            className="font-mono text-[11px] border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[#475569] focus:outline-none focus:border-[#BFDBFE]"
          />
        </div>
      ) : (
        <div className="font-mono text-[11px] text-[#94A3B8]">
          {fmtDisplay(value.from, value.to)}
        </div>
      )}
    </div>
  )
}

export default DateRangeFilter
