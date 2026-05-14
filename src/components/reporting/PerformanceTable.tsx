'use client'

import type { VAPerformanceRow } from '@/types/reporting'

interface PerformanceTableProps {
  rows: VAPerformanceRow[]
  loading?: boolean
}

function RatePill({ value }: { value: number }) {
  const cls =
    value > 70
      ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
      : value >= 50
        ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
        : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
  return (
    <span className={`inline-block font-mono text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {value.toFixed(1)}%
    </span>
  )
}

function RespTime({ value }: { value: number }) {
  const cls =
    value < 2
      ? 'text-[#059669]'
      : value <= 5
        ? 'text-[#D97706]'
        : 'text-[#DC2626]'
  return <span className={`font-mono text-[11px] ${cls}`}>{value.toFixed(1)} min</span>
}

const COLS = [
  'VA', 'Leads', 'Contacted', 'Resp Time', 'Bookings', 'Booking %', 'Tasks', 'SLA %',
]

export function PerformanceTable({ rows, loading = false }: PerformanceTableProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {COLS.map(col => (
                <th
                  key={col}
                  className="text-left font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8] px-4 py-2.5 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }, (_, i) => (
                  <tr key={i} className="border-b border-[#F1F5F9] last:border-0">
                    {COLS.map(col => (
                      <td key={col} className="px-4 py-3">
                        <div className="h-3 bg-[#E2E8F0] rounded animate-pulse" style={{ width: col === 'VA' ? 120 : 40 }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map(row => (
                  <tr
                    key={row.userId}
                    className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F4F7FB] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center font-mono text-xs text-[#2563EB] flex-shrink-0">
                          {row.avatarInitials}
                        </div>
                        <span className="text-sm font-medium text-[#0F172A] whitespace-nowrap">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-[#475569]">{row.leadsAssigned}</td>
                    <td className="px-4 py-3 font-mono text-sm text-[#475569]">{row.leadsContacted}</td>
                    <td className="px-4 py-3"><RespTime value={row.firstResponseTime} /></td>
                    <td className="px-4 py-3 font-mono text-sm text-[#475569]">{row.appointmentsBooked}</td>
                    <td className="px-4 py-3"><RatePill value={row.bookingRate} /></td>
                    <td className="px-4 py-3 font-mono text-sm text-[#475569]">{row.tasksCompleted}</td>
                    <td className="px-4 py-3"><RatePill value={row.slaCompliance} /></td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PerformanceTable
