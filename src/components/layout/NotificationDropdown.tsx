"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, AlertCircle, AlertTriangle, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationCounts } from "@/app/api/notifications/route";

function fmtWoNumber(n: number): string {
  return `WO-${String(n).padStart(4, "0")}`;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = (await res.json()) as { data?: NotificationCounts };
      if (json.data) setCounts(json.data);
    } catch {
      // Silent — badge just won't show
    }
  }, []);

  // Initial fetch + 60s polling
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh on tab focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const total = counts?.total ?? 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500",
          "transition-colors hover:bg-slate-100 hover:text-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          open && "bg-slate-100 text-slate-900"
        )}
        aria-label={`Notifications${total > 0 ? ` (${total} alerts)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2",
            "w-80 rounded-xl border border-border bg-white shadow-lg shadow-slate-900/10",
            "ring-1 ring-slate-900/5"
          )}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {total > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                {total} alert{total !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {total === 0 ? (
              <AllClear />
            ) : (
              <div className="divide-y divide-border">
                {counts && counts.overdue_work_orders > 0 && (
                  <Section
                    icon={AlertCircle}
                    iconClass="text-red-500"
                    title="Overdue Jobs"
                    count={counts.overdue_work_orders}
                    items={counts.overdue_items.map((i) => ({
                      id: i.id,
                      primary: fmtWoNumber(i.wo_number),
                      secondary: i.property_address,
                    }))}
                    viewAllHref="/dashboard/work-orders"
                    onNavigate={() => setOpen(false)}
                  />
                )}
                {counts && counts.ghl_sync_failures > 0 && (
                  <Section
                    icon={AlertTriangle}
                    iconClass="text-amber-500"
                    title="GHL Sync Failed"
                    count={counts.ghl_sync_failures}
                    items={counts.sync_failed_items.map((i) => ({
                      id: i.id,
                      primary: fmtWoNumber(i.wo_number),
                      secondary: i.title,
                    }))}
                    viewAllHref="/dashboard/work-orders"
                    onNavigate={() => setOpen(false)}
                  />
                )}
                {counts && counts.pending_estimates > 0 && (
                  <Section
                    icon={FileText}
                    iconClass="text-amber-500"
                    title="Estimates Pending"
                    count={counts.pending_estimates}
                    items={counts.estimate_items.map((i) => ({
                      id: i.id,
                      primary: fmtWoNumber(i.wo_number),
                      secondary: i.property_address,
                    }))}
                    viewAllHref="/dashboard/estimates"
                    onNavigate={() => setOpen(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

interface SectionItem { id: string; primary: string; secondary: string }

function Section({
  icon: Icon,
  iconClass,
  title,
  count,
  items,
  viewAllHref,
  onNavigate,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  count: number;
  items: SectionItem[];
  viewAllHref: string;
  onNavigate: () => void;
}) {
  return (
    <div className="py-2">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 pb-1.5 pt-1">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} />
        <span className="text-xs font-semibold text-slate-700">{title}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {count}
        </span>
      </div>

      {/* Items */}
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/dashboard/work-orders/${item.id}`}
          onClick={onNavigate}
          className="flex items-start gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800">{item.primary}</p>
            <p className="truncate text-xs text-slate-500">{item.secondary}</p>
          </div>
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        </Link>
      ))}

      {/* View all */}
      <Link
        href={viewAllHref}
        onClick={onNavigate}
        className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
      >
        View all {title.toLowerCase()}
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── All clear ────────────────────────────────────────────────────────────────

function AllClear() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
      <p className="text-sm font-medium text-slate-700">All caught up</p>
      <p className="text-xs text-slate-400">No alerts right now.</p>
    </div>
  );
}
