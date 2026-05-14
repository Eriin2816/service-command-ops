import { BarChart2, Database, SlidersHorizontal } from 'lucide-react'

interface EmptyStateProps {
  title: string
  message: string
  icon?: 'chart' | 'data' | 'filter'
  action?: { label: string; onClick: () => void }
}

const ICONS = {
  chart:  BarChart2,
  data:   Database,
  filter: SlidersHorizontal,
} as const

export function EmptyState({ title, message, icon = 'chart', action }: EmptyStateProps) {
  const Icon = ICONS[icon]
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <Icon className="w-12 h-12 text-[#CBD5E1]" strokeWidth={1.5} />
      <h3 className="mt-4 text-base font-semibold text-[#475569]">{title}</h3>
      <p className="mt-2 text-[13px] text-[#94A3B8] max-w-sm mx-auto leading-relaxed">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 font-mono text-xs px-4 py-2 rounded-lg border border-[#06B6D4] text-[#0284C7] hover:bg-[#ECFEFF] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
