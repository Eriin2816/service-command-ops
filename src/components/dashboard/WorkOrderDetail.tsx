"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  CalendarDays,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Info,
  Building2,
} from "lucide-react";
import {
  WorkOrderStatus,
  Priority,
  ServiceCategory,
  EstimateHandoffStatus,
  WORK_ORDER_STATUS_TRANSITIONS,
} from "@/types/work-order";
import type { WorkOrderWithRelations } from "@/types/work-order";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
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
  [ServiceCategory.WEEKLY_POOL_MAINTENANCE]:    "Weekly Pool Maintenance",
  [ServiceCategory.POOL_REPAIR]:                "Pool Repair",
  [ServiceCategory.POOL_INSPECTION_DIAGNOSTIC]: "Pool Inspection / Diagnostic",
  [ServiceCategory.FILTER_CLEANING]:            "Filter Cleaning",
  [ServiceCategory.HEATER_SERVICE]:             "Heater Service",
  [ServiceCategory.EQUIPMENT_INSTALLATION]:     "Equipment Installation",
  [ServiceCategory.POOL_REMODEL]:               "Pool Remodel",
  [ServiceCategory.NEW_CONSTRUCTION]:           "New Construction",
  [ServiceCategory.EMERGENCY_SERVICE]:          "Emergency Service",
  [ServiceCategory.OTHER]:                      "Other",
};

const ESTIMATE_HANDOFF_CONFIG: Record<EstimateHandoffStatus, { label: string; className: string; description: string }> = {
  [EstimateHandoffStatus.NOT_NEEDED]:   { label: "Not needed",     className: "bg-slate-100 text-slate-500",   description: "" },
  [EstimateHandoffStatus.FLAGGED]:      { label: "Flagged",        className: "bg-amber-50 text-amber-700",    description: "Estimate flagged. Ready to send to GHL." },
  [EstimateHandoffStatus.SENT_TO_GHL]:  { label: "Sent to GHL",   className: "bg-blue-50 text-blue-700",      description: "Estimate request sent to GoHighLevel." },
  [EstimateHandoffStatus.ESTIMATE_SENT]:{ label: "Estimate sent",  className: "bg-purple-50 text-purple-700",  description: "Estimate sent to customer via GHL." },
  [EstimateHandoffStatus.APPROVED]:     { label: "Approved",       className: "bg-emerald-50 text-emerald-700",description: "Customer approved the estimate." },
  [EstimateHandoffStatus.DECLINED]:     { label: "Declined",       className: "bg-red-50 text-red-500",        description: "Customer declined the estimate." },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(2000, 0, 1, hours, minutes);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-white p-5 shadow-sm", className)}>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">{children}</dd>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WorkOrderDetail({ workOrder }: { workOrder: WorkOrderWithRelations }) {
  const [status, setStatus] = useState<WorkOrderStatus>(workOrder.status);
  const [estimateHandoff, setEstimateHandoff] = useState<EstimateHandoffStatus>(
    workOrder.estimate_handoff_status
  );
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const allowedTransitions = WORK_ORDER_STATUS_TRANSITIONS[status];
  const canFlagEstimate = allowedTransitions.includes(WorkOrderStatus.ESTIMATE_NEEDED);
  const isTerminal = status === WorkOrderStatus.CANCELLED;

  function applyStatusChange(newStatus: WorkOrderStatus) {
    const prevLabel = STATUS_CONFIG[status].label;
    const nextLabel = STATUS_CONFIG[newStatus].label;
    setStatus(newStatus);
    if (newStatus === WorkOrderStatus.ESTIMATE_NEEDED) {
      setEstimateHandoff(EstimateHandoffStatus.FLAGGED);
    }
    setSavedBanner(`Status changed from "${prevLabel}" → "${nextLabel}" (mock — not persisted)`);
  }

  useEffect(() => {
    if (!savedBanner) return;
    const t = setTimeout(() => setSavedBanner(null), 5000);
    return () => clearTimeout(t);
  }, [savedBanner]);

  const statusCfg = STATUS_CONFIG[status];
  const priorityCfg = PRIORITY_CONFIG[workOrder.priority];

  // Build placeholder status history from timestamps
  const statusHistory = [
    { icon: CircleDot, label: "Work order created", time: formatDateTime(workOrder.created_at), isCurrent: false },
    ...(workOrder.status !== WorkOrderStatus.NEW
      ? [{ icon: CheckCircle2, label: `Status: ${statusCfg.label}`, time: formatDateTime(workOrder.updated_at), isCurrent: true }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">

      {/* Mock save banner */}
      {savedBanner && (
        <div className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Page header */}
      <div>
        <Breadcrumb
          items={[
            { label: "Work Orders", href: "/dashboard/work-orders" },
            { label: workOrder.wo_number },
          ]}
          className="mb-2"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400">
                {workOrder.wo_number}
              </span>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusCfg.className)}>
                {statusCfg.label}
              </span>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", priorityCfg.className)}>
                {priorityCfg.label}
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">
              {workOrder.title}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {workOrder.property_customer_name} · {workOrder.property_address}
            </p>
          </div>

          {/* Action bar */}
          {!isTerminal && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canFlagEstimate && (
                <button
                  type="button"
                  onClick={() => applyStatusChange(WorkOrderStatus.ESTIMATE_NEEDED)}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Flag Estimate Needed
                </button>
              )}

              {allowedTransitions.length > 0 && (
                <select
                  key={status}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      applyStatusChange(e.target.value as WorkOrderStatus);
                    }
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  aria-label="Change work order status"
                >
                  <option value="" disabled>Change status…</option>
                  {allowedTransitions
                    .filter((s) => s !== WorkOrderStatus.ESTIMATE_NEEDED)
                    .map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
              )}

              {isTerminal && (
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400">
                  No further transitions
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left column (main content) ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Job Info */}
          <SectionCard title="Job Info">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Service Category">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {CATEGORY_LABELS[workOrder.service_category]}
                </span>
              </Field>

              {workOrder.completed_at && (
                <Field label="Completed At">
                  {formatDateTime(workOrder.completed_at)}
                </Field>
              )}

              {workOrder.description && (
                <div className="sm:col-span-2">
                  <dt className="mb-1 text-xs font-medium text-slate-400">Description</dt>
                  <dd className="rounded-lg border border-border bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                    {workOrder.description}
                  </dd>
                </div>
              )}

              {/* GHL links — only shown when present */}
              {(workOrder.ghl_contact_id || workOrder.ghl_opportunity_id) && (
                <div className="sm:col-span-2">
                  <dt className="mb-2 text-xs font-medium text-slate-400">GoHighLevel References</dt>
                  <dd className="flex flex-wrap gap-2">
                    {workOrder.ghl_contact_id && (
                      <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-500">
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                        Contact: {workOrder.ghl_contact_id}
                      </span>
                    )}
                    {workOrder.ghl_opportunity_id && (
                      <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-500">
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                        Opportunity: {workOrder.ghl_opportunity_id}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </SectionCard>

          {/* Property */}
          <SectionCard title="Property">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Building2 className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{workOrder.property_customer_name}</p>
                  <p className="mt-0.5 flex items-start gap-1 text-sm text-slate-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {workOrder.property_address}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/properties/${workOrder.property_id}`}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-brand-300 hover:text-brand-600"
              >
                View Property
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </SectionCard>

          {/* Estimate Handoff — only shown when flagged */}
          {estimateHandoff !== EstimateHandoffStatus.NOT_NEEDED && (
            <SectionCard title="Estimate Handoff">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        ESTIMATE_HANDOFF_CONFIG[estimateHandoff].className
                      )}>
                        {ESTIMATE_HANDOFF_CONFIG[estimateHandoff].label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {ESTIMATE_HANDOFF_CONFIG[estimateHandoff].description}
                    </p>
                    {!workOrder.ghl_opportunity_id && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        No GHL opportunity linked — add one before sending to GHL.
                      </p>
                    )}
                  </div>
                </div>

                {estimateHandoff === EstimateHandoffStatus.FLAGGED && (
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    onClick={() => {
                      setEstimateHandoff(EstimateHandoffStatus.SENT_TO_GHL);
                      setSavedBanner("Estimate sent to GHL (mock — not persisted)");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Send to GHL
                  </button>
                )}
              </div>
            </SectionCard>
          )}

          {/* Status History (placeholder) */}
          <SectionCard title="Status History">
            <ol className="space-y-4">
              {statusHistory.map((entry, i) => {
                const Icon = entry.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      entry.isCurrent
                        ? "bg-brand-100 text-brand-600"
                        : "bg-slate-100 text-slate-400"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", entry.isCurrent ? "text-slate-800" : "text-slate-600")}>
                        {entry.label}
                      </p>
                      <p className="text-xs text-slate-400">{entry.time}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-slate-400">Full history log coming in Phase 3.</p>
          </SectionCard>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5 lg:col-span-1">

          {/* Assignment */}
          <SectionCard title="Assignment">
            <dl className="space-y-4">
              <Field label="Assigned Technician">
                {workOrder.assigned_technician_name ? (
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {workOrder.assigned_technician_name.charAt(0)}
                    </span>
                    <span className="font-medium">{workOrder.assigned_technician_name}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <User className="h-4 w-4" />
                    Unassigned
                  </span>
                )}
              </Field>
            </dl>
            <p className="mt-4 text-xs text-slate-400">Technician reassignment coming in Phase 2 create form.</p>
          </SectionCard>

          {/* Schedule */}
          <SectionCard title="Schedule">
            <dl className="space-y-4">
              <Field label="Scheduled Date">
                {workOrder.scheduled_date ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(workOrder.scheduled_date)}
                  </span>
                ) : (
                  <span className="text-slate-400">Not scheduled</span>
                )}
              </Field>

              {(workOrder.scheduled_time_start || workOrder.scheduled_time_end) && (
                <Field label="Time Window">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {workOrder.scheduled_time_start ? formatTime(workOrder.scheduled_time_start) : "—"}
                    {" – "}
                    {workOrder.scheduled_time_end ? formatTime(workOrder.scheduled_time_end) : "—"}
                  </span>
                </Field>
              )}

              <Field label="Created">
                {formatDateTime(workOrder.created_at)}
              </Field>

              <Field label="Last Updated">
                {formatDateTime(workOrder.updated_at)}
              </Field>
            </dl>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
