interface LoadingSkeletonProps {
  variant: 'cards' | 'chart' | 'table' | 'full'
  count?: number
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E2E8F0] rounded" />
      <div className="h-3 bg-[#E2E8F0] rounded animate-pulse w-24 mt-1" />
      <div className="h-8 bg-[#E2E8F0] rounded animate-pulse w-3/4 mt-3" />
      <div className="h-3 bg-[#E2E8F0] rounded animate-pulse w-1/2 mt-2" />
      <div className="h-5 bg-[#E2E8F0] rounded animate-pulse w-28 mt-3" />
    </div>
  )
}

function SkeletonChart({ height = 160 }: { height?: number }) {
  return (
    <div
      className="bg-[#F4F7FB] rounded-lg animate-pulse w-full"
      style={{ height }}
    />
  )
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-[#F1F5F9]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#E2E8F0] animate-pulse flex-shrink-0" />
          <div className="h-3 bg-[#E2E8F0] rounded animate-pulse w-28" />
        </div>
      </td>
      {[40, 40, 50, 40, 60, 40, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-[#E2E8F0] rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export function LoadingSkeleton({ variant, count = 4 }: LoadingSkeletonProps) {
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (variant === 'chart') {
    return <SkeletonChart height={200} />
  }

  if (variant === 'table') {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {['VA', 'Leads', 'Contacted', 'Resp Time', 'Bookings', 'Booking %', 'Tasks', 'SLA %'].map(h => (
                  <th key={h} className="px-4 py-2.5">
                    <div className="h-2.5 bg-[#E2E8F0] rounded animate-pulse w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }, (_, i) => <SkeletonTableRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // full
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
      <SkeletonChart height={200} />
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {Array.from({ length: 8 }, (_, i) => (
                  <th key={i} className="px-4 py-2.5">
                    <div className="h-2.5 bg-[#E2E8F0] rounded animate-pulse w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }, (_, i) => <SkeletonTableRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LoadingSkeleton
