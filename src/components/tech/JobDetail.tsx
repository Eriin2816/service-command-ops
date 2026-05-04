"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Key,
  Camera,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WorkOrderStatus,
  Priority,
  ServiceCategory,
  type WorkOrderWithRelations,
} from "@/types/work-order";
import type { PropertyWithRelations } from "@/types/property";
import type { ChecklistItem } from "@/types/visit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  wo: WorkOrderWithRelations;
  property: PropertyWithRelations | undefined;
  initialChecklist: ChecklistItem[];
}

type ActionResult = null | "complete" | "estimate";

// ─── Label maps ───────────────────────────────────────────────────────────────

const SERVICE_LABEL: Record<ServiceCategory, string> = {
  [ServiceCategory.WEEKLY_POOL_MAINTENANCE]:    "Weekly Maintenance",
  [ServiceCategory.POOL_REPAIR]:                "Pool Repair",
  [ServiceCategory.POOL_INSPECTION_DIAGNOSTIC]: "Inspection / Diagnostic",
  [ServiceCategory.FILTER_CLEANING]:            "Filter Cleaning",
  [ServiceCategory.HEATER_SERVICE]:             "Heater Service",
  [ServiceCategory.EQUIPMENT_INSTALLATION]:     "Equipment Install",
  [ServiceCategory.POOL_REMODEL]:               "Pool Remodel",
  [ServiceCategory.NEW_CONSTRUCTION]:           "New Construction",
  [ServiceCategory.EMERGENCY_SERVICE]:          "Emergency Service",
  [ServiceCategory.OTHER]:                      "Other",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  [Priority.LOW]:    "",
  [Priority.NORMAL]: "",
  [Priority.HIGH]:   "bg-amber-50 text-amber-700 border border-amber-200",
  [Priority.URGENT]: "bg-red-50 text-red-600 border border-red-200",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.LOW]:    "",
  [Priority.NORMAL]: "",
  [Priority.HIGH]:   "High Priority",
  [Priority.URGENT]: "Urgent",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </h2>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JobDetail({ wo, property, initialChecklist }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [notes, setNotes]         = useState("");
  const [result, setResult]       = useState<ActionResult>(null);

  const checkedCount  = checklist.filter((i) => i.completed).length;
  const totalCount    = checklist.length;
  const progressPct   = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const allChecked    = checkedCount === totalCount;
  const isLocked      = result !== null;

  const address = [
    property?.address_line1,
    property?.address_line2,
    property?.city && property?.state
      ? `${property.city}, ${property.state} ${property.zip ?? ""}`.trim()
      : undefined,
  ]
    .filter(Boolean)
    .join(", ") || wo.property_address;

  function toggleItem(id: string) {
    if (isLocked) return;
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }

  function handleAction(action: "complete" | "estimate") {
    setResult(action);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Result banner ──────────────────────────────────────────────────────────

  const resultBanner =
    result === "complete" ? (
      <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3.5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Job marked complete</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {checkedCount}/{totalCount} checklist items · Notes {notes ? "saved" : "not added"}
          </p>
        </div>
      </div>
    ) : result === "estimate" ? (
      <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Estimate flagged for office</p>
          <p className="text-xs text-amber-600 mt-0.5">
            The office will follow up with an estimate for this job.
          </p>
        </div>
      </div>
    ) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pb-5 pt-4 shadow-sm">
        <Link
          href="/tech/today"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 active:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" />
          Today&apos;s Jobs
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-400">{wo.wo_number}</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight text-slate-900">
              {wo.property_customer_name}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-slate-500">
              {SERVICE_LABEL[wo.service_category]}
            </p>
          </div>

          {PRIORITY_LABEL[wo.priority] && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                PRIORITY_BADGE[wo.priority]
              )}
            >
              {PRIORITY_LABEL[wo.priority]}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm leading-snug text-slate-700">{address}</p>
        </div>
      </div>

      {/* ── Result banner ───────────────────────────────────────────────────── */}
      {resultBanner}

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="space-y-5 px-4 pb-36 pt-5">

        {/* Access Notes */}
        {(property?.gate_code || property?.access_notes) && (
          <div>
            <SectionLabel>Access</SectionLabel>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              {property.gate_code && (
                <div className="mb-2.5 flex items-center gap-2">
                  <Key className="h-4 w-4 shrink-0 text-amber-600" />
                  <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 font-mono text-sm font-bold tracking-widest text-amber-800">
                    {property.gate_code}
                  </span>
                  <span className="text-xs font-semibold text-amber-600">Gate code</span>
                </div>
              )}
              {property.access_notes && (
                <p className="text-sm leading-relaxed text-amber-800">{property.access_notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Checklist</SectionLabel>
            <span className="text-xs font-semibold text-slate-500">
              {checkedCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                allChecked ? "bg-emerald-500" : "bg-brand-500"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <Card className="overflow-hidden">
            {checklist.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                disabled={isLocked}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-4 text-left",
                  "transition-colors active:bg-slate-50",
                  i > 0 && "border-t border-slate-100",
                  isLocked && "cursor-default opacity-80"
                )}
              >
                {/* Checkbox circle */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    item.completed
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-300 bg-white"
                  )}
                >
                  {item.completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>

                <span
                  className={cn(
                    "flex-1 text-sm leading-snug",
                    item.completed ? "text-slate-400 line-through" : "text-slate-800"
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </Card>
        </div>

        {/* Notes */}
        <div>
          <SectionLabel>Technician Notes</SectionLabel>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Visit notes</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLocked}
              placeholder="Add notes about this visit — chemical readings, issues found, follow-up items…"
              rows={4}
              className={cn(
                "mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3",
                "text-sm leading-relaxed text-slate-800 placeholder:text-slate-400",
                "focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100",
                "transition-colors",
                isLocked && "cursor-default opacity-60"
              )}
            />
          </Card>
        </div>

        {/* Photos */}
        <div>
          <SectionLabel>Photos</SectionLabel>
          <Card className="p-4">
            <button
              type="button"
              disabled={isLocked}
              className={cn(
                "flex w-full flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 py-7",
                "text-slate-400 transition-colors active:bg-slate-50",
                "hover:border-brand-300 hover:text-brand-500",
                isLocked && "cursor-default opacity-60"
              )}
            >
              <Camera className="h-7 w-7" />
              <div className="text-center">
                <p className="text-sm font-semibold">Add Photos</p>
                <p className="mt-0.5 text-xs">Photo upload coming in a future phase</p>
              </div>
            </button>
          </Card>
        </div>

      </div>

      {/* ── Sticky action bar ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 pb-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {result ? (
          <Link
            href="/tech/today"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white active:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Today&apos;s Jobs
          </Link>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleAction("complete")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-white",
                "bg-emerald-500 transition-opacity active:opacity-80"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </button>
            <button
              type="button"
              onClick={() => handleAction("estimate")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold",
                "border-2 border-amber-300 bg-amber-50 text-amber-700 transition-opacity active:opacity-80"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              Estimate Needed
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
