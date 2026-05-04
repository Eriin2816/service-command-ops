import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  accent?: "brand" | "amber" | "green" | "red";
}

const ACCENT_STYLES = {
  brand:  { icon: "bg-brand-50 text-brand-600",  border: "border-t-brand-500" },
  amber:  { icon: "bg-amber-50 text-amber-600",  border: "border-t-amber-500" },
  green:  { icon: "bg-emerald-50 text-emerald-600", border: "border-t-emerald-500" },
  red:    { icon: "bg-red-50 text-red-600",      border: "border-t-red-500" },
};

const TREND_COLORS = {
  up:      "text-emerald-600",
  down:    "text-red-500",
  neutral: "text-slate-500",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "brand" }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white p-5 shadow-sm",
        "border-t-2",
        styles.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-bold text-slate-900">
            {value}
          </p>
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", TREND_COLORS[trend.direction])}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
