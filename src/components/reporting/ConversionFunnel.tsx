'use client'

import type { FunnelStage } from '@/types/reporting'

interface ConversionFunnelProps {
  stages: FunnelStage[]
  loading?: boolean
}

function fmtCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function rateColor(rate: number): string {
  if (rate === 100) return 'text-[#94A3B8]'
  if (rate > 70)   return 'text-[#059669]'
  if (rate >= 50)  return 'text-[#D97706]'
  return 'text-[#DC2626]'
}

export function ConversionFunnel({ stages, loading = false }: ConversionFunnelProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {[100, 85, 70, 55, 42].map((w, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="bg-[#E2E8F0] rounded animate-pulse h-14"
              style={{ width: `${w}%` }}
            />
            {i < 4 && <div className="text-[#E2E8F0] text-sm">↓</div>}
          </div>
        ))}
      </div>
    )
  }

  const count = stages.length
  return (
    <div className="space-y-1">
      {stages.map((stage, i) => {
        const widthPct = 100 - (i * (60 / Math.max(count - 1, 1)))
        return (
          <div key={stage.stage} className="flex flex-col items-center">
            <div
              className="relative rounded-md px-4 py-3 flex items-center justify-between"
              style={{
                width: `${widthPct}%`,
                backgroundColor: stage.color + '1F',
                border: `1px solid ${stage.color}4D`,
              }}
            >
              <div>
                <div className="text-[13px] font-semibold text-[#0F172A]">{stage.stage}</div>
                <div className="font-mono text-lg font-bold" style={{ color: stage.color }}>
                  {stage.count}
                </div>
                {stage.value > 0 && (
                  <div className="text-xs text-[#64748B]">{fmtCents(stage.value)}</div>
                )}
              </div>
              <div className={`font-mono text-[11px] font-semibold ${rateColor(stage.conversionRate)}`}>
                {stage.conversionRate.toFixed(1)}%
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="text-[#CBD5E1] text-sm leading-none py-0.5">↓</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ConversionFunnel
