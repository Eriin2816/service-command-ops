"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, CalendarDays, X, AlertTriangle } from "lucide-react";
import { WorkOrderStatus, Priority, ServiceCategory } from "@/types/work-order";
import type { WorkOrderWithRelations } from "@/types/work-order";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Display config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; className: string }> = {
  [WorkOrderStatus.NEW]:             { label: "New",             className: "bg-slate-100 text-slate-600" },
  [WorkOrderStatus.ASSIGNED]:        { label: "Assigned",        className: "bg-blue-50 text-blue-700" },
  [WorkOrderStatus.IN_PROGRESS]:     { label: "In Progress",     className: "bg-brand-50 text-brand-700" },
  [WorkOrderStatus.COMPLETED]:       { label: "Completed",       className: "bg-emerald-50 text-emerald-700" },
  [WorkOrderStatus.NEEDS_FOLLOW_UP]: { label: "Needs Follow-Up", className: "bg-orange-50 text-orange-700" },
  [WorkOrderStatus.ESTIMATE_NEEDED]: { label: "Estimate Needed", className: "bg-amber-50 text-amber-700" },
  [WorkOrderStatus.CANCELLED]:       { label: "Cancelled",       className: "bg-red-50 text-red-500" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  [Priority.LOW]:    { label: "Low",    className: "bg-slate-100 text-slate-500" },
  [Priority.NORMAL]: { label: "Normal", className: "bg-slate-100 text-slate-600" },
  [Priority.HIGH]:   { label: "High",   className: "bg-orange-50 text-orange-600" },
  [Priority.URGENT]: { label: "Urgent", className: "bg-red-50 text-red-600 font-semibold" },
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.WEEKLY_POOL_MAINTENANCE]:    "Weekly Maintenance",
  [ServiceCategory.POOL_REPAIR]:                "Pool Repair",
  [ServiceCategory.POOL_INSPECTION_DIAGNOSTIC]: "Inspection",
  [ServiceCategory.FILTER_CLEANING]:            "Filter Cleaning",
  [ServiceCategory.HEATER_SERVICE]:             "Heater Service",
  [ServiceCategory.EQUIPMENT_INSTALLATION]:     "Equipment Install",
  [ServiceCategory.POOL_REMODEL]:               "Pool Remodel",
  [ServiceCategory.NEW_CONSTRUCTION]:           "New Construction",
  [ServiceCategory.EMERGENCY_SERVICE]:          "Emergency",
  [ServiceCategory.OTHER]:                      "Other",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 8 }, (_, i) => (
        <TableCell key={i}>
          <div className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkOrdersTable() {
  const [workOrders, setWorkOrders] = useState<WorkOrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "">("");

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/work-orders");
      const json = (await r.json()) as { data?: WorkOrderWithRelations[]; error?: string };
      if (json.error) {
        setError(json.error);
      } else {
        setWorkOrders(json.data ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWorkOrders();
  }, [fetchWorkOrders]);

  const hasFilters = statusFilter !== "" || categoryFilter !== "";

  const filtered = workOrders.filter((wo) => {
    if (statusFilter && wo.status !== statusFilter) return false;
    if (categoryFilter && wo.service_category !== categoryFilter) return false;
    return true;
  });

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

  if (error) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchWorkOrders()}
          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-slate-50/60 px-4 py-3">
        <p className="text-sm text-slate-500">
          {loading ? (
            <span className="inline-block h-3 w-24 animate-pulse rounded bg-slate-200" />
          ) : hasFilters ? (
            <>
              <span className="font-medium text-slate-700">{filtered.length}</span>
              {" of "}
              <span className="font-medium text-slate-700">{workOrders.length}</span>
              {" work orders"}
            </>
          ) : (
            <>
              <span className="font-medium text-slate-700">{workOrders.length}</span>
              {" work orders"}
            </>
          )}
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | "")}
            className={selectClass}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {Object.values(WorkOrderStatus).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | "")}
            className={selectClass}
            aria-label="Filter by service category"
          >
            <option value="">All Categories</option>
            {Object.values(ServiceCategory).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => { setStatusFilter(""); setCategoryFilter(""); }}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-white hover:bg-white">
            <TableHead className="w-24">WO #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-32">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Date
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-14 text-center text-sm text-slate-400">
                {workOrders.length === 0
                  ? "No work orders yet. Create one to get started."
                  : "No work orders match the selected filters."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((wo) => {
              const status = STATUS_CONFIG[wo.status];
              const priority = PRIORITY_CONFIG[wo.priority];

              return (
                <TableRow key={wo.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {wo.wo_number}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/dashboard/work-orders/${wo.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
                    >
                      {wo.title}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-700">{wo.property_customer_name}</p>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{wo.property_address}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {wo.assigned_technician_name ? (
                      <span className="flex items-center gap-1.5 text-sm text-slate-700">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                          {wo.assigned_technician_name.charAt(0)}
                        </span>
                        {wo.assigned_technician_name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="h-3.5 w-3.5" />
                        Unassigned
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
                      {status.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", priority.className)}>
                      {priority.label}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm text-slate-600">
                    {CATEGORY_LABELS[wo.service_category]}
                  </TableCell>

                  <TableCell className="text-sm text-slate-500">
                    {wo.scheduled_date ? formatDate(wo.scheduled_date) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
