"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarClock,
  Power,
} from "lucide-react";
import { ScheduleFrequency, FREQUENCY_LABELS, DAY_OF_WEEK_LABELS } from "@/types/recurring-schedule";
import { ServiceCategory } from "@/types/work-order";
import type { RecurringScheduleWithRelations } from "@/types/recurring-schedule";
import { cn } from "@/lib/utils";

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.WEEKLY_POOL_MAINTENANCE]:    "Weekly Pool Maintenance",
  [ServiceCategory.POOL_REPAIR]:                "Pool Repair",
  [ServiceCategory.POOL_INSPECTION_DIAGNOSTIC]: "Pool Inspection",
  [ServiceCategory.FILTER_CLEANING]:            "Filter Cleaning",
  [ServiceCategory.HEATER_SERVICE]:             "Heater Service",
  [ServiceCategory.EQUIPMENT_INSTALLATION]:     "Equipment Installation",
  [ServiceCategory.POOL_REMODEL]:               "Pool Remodel",
  [ServiceCategory.NEW_CONSTRUCTION]:           "New Construction",
  [ServiceCategory.EMERGENCY_SERVICE]:          "Emergency Service",
  [ServiceCategory.OTHER]:                      "Other Service",
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";
const selectCls = inputCls;
const labelCls = "mb-1 block text-xs font-medium text-slate-500";

// ─── Form state ───────────────────────────────────────────────────────────────

interface ScheduleFormState {
  frequency:        ScheduleFrequency;
  day_of_week:      number;
  time_start:       string;
  time_end:         string;
  service_category: ServiceCategory;
  starts_on:        string;
  ends_on:          string;
  technician_id:    string;
  is_active:        boolean;
}

function defaultForm(): ScheduleFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    frequency:        ScheduleFrequency.WEEKLY,
    day_of_week:      1, // Monday
    time_start:       "08:00",
    time_end:         "09:00",
    service_category: ServiceCategory.WEEKLY_POOL_MAINTENANCE,
    starts_on:        today,
    ends_on:          "",
    technician_id:    "",
    is_active:        true,
  };
}

function scheduleToForm(s: RecurringScheduleWithRelations): ScheduleFormState {
  return {
    frequency:        s.frequency,
    day_of_week:      s.day_of_week,
    time_start:       s.time_start ?? "",
    time_end:         s.time_end ?? "",
    service_category: s.service_category,
    starts_on:        s.starts_on,
    ends_on:          s.ends_on ?? "",
    technician_id:    s.technician_id ?? "",
    is_active:        s.is_active,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Technician {
  id:    string;
  name:  string;
}

export function ServiceScheduleCard({ propertyId }: { propertyId: string }) {
  const [schedules,    setSchedules]    = useState<RecurringScheduleWithRelations[]>([]);
  const [technicians,  setTechnicians]  = useState<Technician[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [formOpen,     setFormOpen]     = useState(false);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [form,         setForm]         = useState<ScheduleFormState>(defaultForm());
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  // Load schedules
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recurring-schedules?property_id=${propertyId}`);
      const json = await res.json() as { data?: RecurringScheduleWithRelations[] };
      setSchedules(json.data ?? []);
    } catch {
      // silently fail — empty list is fine
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // Load technicians (for the dropdown)
  useEffect(() => {
    fetch("/api/technicians")
      .then((r) => r.json())
      .then((j: { data?: Technician[] }) => setTechnicians(j.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  // Auto-clear success message
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Form helpers ──

  function openCreate() {
    setForm(defaultForm());
    setEditingId(null);
    setFormOpen(true);
    setError(null);
  }

  function openEdit(s: RecurringScheduleWithRelations) {
    setForm(scheduleToForm(s));
    setEditingId(s.id);
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError(null);
  }

  function set<K extends keyof ScheduleFormState>(k: K, v: ScheduleFormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        property_id:      propertyId,
        frequency:        form.frequency,
        day_of_week:      form.day_of_week,
        time_start:       form.time_start || undefined,
        time_end:         form.time_end   || undefined,
        service_category: form.service_category,
        starts_on:        form.starts_on,
        ends_on:          form.ends_on   || undefined,
        technician_id:    form.technician_id || undefined,
        is_active:        form.is_active,
      };

      const url    = editingId ? `/api/recurring-schedules/${editingId}` : "/api/recurring-schedules";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Save failed");
      }

      setSuccessMsg(editingId ? "Schedule updated." : "Schedule created.");
      closeForm();
      await loadSchedules();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(s: RecurringScheduleWithRelations) {
    try {
      await fetch(`/api/recurring-schedules/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      setSuccessMsg(s.is_active ? "Schedule paused." : "Schedule activated.");
      await loadSchedules();
    } catch {
      setError("Failed to update schedule");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/recurring-schedules/${id}`, { method: "DELETE" });
      setSuccessMsg("Schedule deleted.");
      await loadSchedules();
    } catch {
      setError("Failed to delete schedule");
    } finally {
      setDeletingId(null);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Service Schedule
        </h3>
        {!formOpen && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
          >
            <Plus className="h-3 w-3" />
            Add Schedule
          </button>
        )}
      </div>

      {/* Success / error banners */}
      {successMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <Check className="h-3.5 w-3.5 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <X className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Schedule list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : schedules.length === 0 && !formOpen ? (
        <div className="flex flex-col items-center gap-2 py-7">
          <CalendarClock className="h-8 w-8 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">No recurring schedules</p>
          <p className="text-center text-xs text-slate-400">
            Add a schedule to auto-generate weekly work orders.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div
              key={s.id}
              className={cn(
                "rounded-lg border p-3",
                s.is_active
                  ? "border-brand-200 bg-brand-50/40"
                  : "border-slate-200 bg-slate-50/60 opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 shrink-0 text-brand-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      {FREQUENCY_LABELS[s.frequency]} — {DAY_OF_WEEK_LABELS[s.day_of_week]}s
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {s.is_active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {CATEGORY_LABELS[s.service_category]}
                    {s.time_start && ` · ${s.time_start}${s.time_end ? `–${s.time_end}` : ""}`}
                    {s.technician_name && ` · ${s.technician_name}`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Starts {s.starts_on}
                    {s.ends_on && ` · Ends ${s.ends_on}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title={s.is_active ? "Pause schedule" : "Activate schedule"}
                    onClick={() => handleToggleActive(s)}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-300"
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(s)}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-300"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete schedule"
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-300 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline form */}
      {formOpen && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {editingId ? "Edit Schedule" : "New Schedule"}
          </p>

          <div className="space-y-3">
            {/* Row 1: Frequency + Day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Frequency</label>
                <select
                  className={selectCls}
                  value={form.frequency}
                  onChange={(e) => set("frequency", e.target.value as ScheduleFrequency)}
                >
                  {Object.values(ScheduleFrequency).map((f) => (
                    <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Day of Week</label>
                <select
                  className={selectCls}
                  value={form.day_of_week}
                  onChange={(e) => set("day_of_week", parseInt(e.target.value))}
                >
                  {Object.entries(DAY_OF_WEEK_LABELS).map(([d, label]) => (
                    <option key={d} value={d}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Time window */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Time Start</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.time_start}
                  onChange={(e) => set("time_start", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Time End</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.time_end}
                  onChange={(e) => set("time_end", e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Service category */}
            <div>
              <label className={labelCls}>Service Category</label>
              <select
                className={selectCls}
                value={form.service_category}
                onChange={(e) => set("service_category", e.target.value as ServiceCategory)}
              >
                {Object.values(ServiceCategory).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            {/* Row 4: Technician */}
            <div>
              <label className={labelCls}>Assigned Technician</label>
              <select
                className={selectCls}
                value={form.technician_id}
                onChange={(e) => set("technician_id", e.target.value)}
              >
                <option value="">— Unassigned —</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Row 5: Start + End date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Starts On</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.starts_on}
                  onChange={(e) => set("starts_on", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Ends On (optional)</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.ends_on}
                  onChange={(e) => set("ends_on", e.target.value)}
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-300"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              <span className="text-sm text-slate-700">Active (generates work orders)</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.starts_on}
              className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              {saving ? "Saving…" : editingId ? "Update" : "Save Schedule"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
