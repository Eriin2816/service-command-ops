import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto" strokeWidth={1.5} />
      <h3 className="mt-3 text-sm font-semibold text-[#991B1B]">Failed to load reporting data</h3>
      {message && (
        <p className="mt-1 text-xs text-[#EF4444]">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 font-mono text-xs px-4 py-2 rounded-lg border border-[#EF4444] text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export default ErrorState
