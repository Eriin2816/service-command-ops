'use client'

import React from 'react'
import type { MetricDelta } from '@/types/reporting'

type AccentColor = 'cyan' | 'emerald' | 'amber' | 'purple' | 'red' | 'blue'
type FormatType = 'number' | 'currency' | 'percent' | 'time' | 'raw'

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  delta?: MetricDelta
  accent?: AccentColor
  icon?: React.ReactNode
  loading?: boolean
  format?: FormatType
}

const accentStyles: Record<AccentColor, { bar: string; text: string; iconBg: string; iconText: string }> = {
  cyan:    { bar: 'bg-[#06B6D4]', text: 'text-[#0284C7]', iconBg: 'bg-[#ECFEFF]', iconText: 'text-[#06B6D4]' },
  emerald: { bar: 'bg-[#10B981]', text: 'text-[#059669]', iconBg: 'bg-[#ECFDF5]', iconText: 'text-[#10B981]' },
  amber:   { bar: 'bg-[#F59E0B]', text: 'text-[#D97706]', iconBg: 'bg-[#FFFBEB]', iconText: 'text-[#F59E0B]' },
  purple:  { bar: 'bg-[#8B5CF6]', text: 'text-[#7C3AED]', iconBg: 'bg-[#F5F3FF]', iconText: 'text-[#8B5CF6]' },
  red:     { bar: 'bg-[#EF4444]', text: 'text-[#DC2626]', iconBg: 'bg-[#FEF2F2]', iconText: 'text-[#EF4444]' },
  blue:    { bar: 'bg-[#3B82F6]', text: 'text-[#2563EB]', iconBg: 'bg-[#EFF6FF]', iconText: 'text-[#3B82F6]' },
}

function formatValue(value: string | number, fmt: FormatType): string {
  if (fmt === 'raw' || typeof value === 'string') return String(value)
  if (fmt === 'currency') return '$' + (value / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (fmt === 'percent') return value.toFixed(1) + '%'
  if (fmt === 'time') return value.toFixed(1) + ' min'
  return value.toLocaleString('en-US')
}

export function MetricCard({
  label,
  value,
  subValue,
  delta,
  accent = 'cyan',
  icon,
  loading = false,
  format = 'number',
}: MetricCardProps) {
  const styles = accentStyles[accent]

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-[3px] ${styles.bar}`} />
        <div className="h-3 bg-[#E2E8F0] rounded animate-pulse w-24 mt-1" />
        <div className="h-8 bg-[#E2E8F0] rounded animate-pulse w-3/4 mt-3" />
        <div className="h-3 bg-[#E2E8F0] rounded animate-pulse w-1/2 mt-2" />
        <div className="h-5 bg-[#E2E8F0] rounded animate-pulse w-28 mt-3" />
      </div>
    )
  }

  const deltaArrow = delta?.direction === 'up' ? '↑' : delta?.direction === 'down' ? '↓' : '→'
  const deltaClasses =
    delta?.direction === 'up'
      ? 'text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0]'
      : delta?.direction === 'down'
        ? 'text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA]'
        : 'text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0]'

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden hover:border-[#CBD5E1] hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-default">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${styles.bar}`} />

      <div className="flex items-start justify-between mt-1">
        <span className="font-mono text-[10px] tracking-[0.10em] uppercase text-[#94A3B8]">
          {label}
        </span>
        {icon && (
          <span className={`flex items-center justify-center w-7 h-7 rounded-full ${styles.iconBg} ${styles.iconText}`}>
            {icon}
          </span>
        )}
      </div>

      <div className={`text-3xl font-bold mt-2 ${styles.text}`}>
        {formatValue(value, format)}
      </div>

      {subValue && (
        <div className="text-xs text-[#64748B] mt-1">{subValue}</div>
      )}

      {delta && (
        <div className={`inline-flex items-center gap-1 mt-2 font-mono text-[11px] font-medium px-2 py-0.5 rounded-md ${deltaClasses}`}>
          <span>{deltaArrow}</span>
          <span>{Math.abs(delta.percentage).toFixed(1)}% {delta.label}</span>
        </div>
      )}
    </div>
  )
}

export default MetricCard
