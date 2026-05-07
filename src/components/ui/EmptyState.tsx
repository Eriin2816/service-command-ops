import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconClassName = "text-brand-500",
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <Icon className={`h-7 w-7 ${iconClassName}`} />
        </div>
        <div>
          <p className="font-display text-base font-semibold text-slate-900">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
