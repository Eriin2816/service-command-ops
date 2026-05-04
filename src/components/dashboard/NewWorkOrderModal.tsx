"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Priority } from "@/types/work-order";
import { NewWorkOrderSchema, type NewWorkOrderFieldErrors } from "@/lib/validation/work-order";
import { serviceTypes, PRIORITY_OPTIONS, MOCK_TECHNICIANS } from "@/config/service-types";
import { cn } from "@/lib/utils";

// ─── Priority selector config ─────────────────────────────────────────────────

const PRIORITY_ACTIVE: Record<Priority, string> = {
  [Priority.LOW]:    "bg-slate-600 text-white border-slate-600",
  [Priority.NORMAL]: "bg-brand-500 text-white border-brand-500",
  [Priority.HIGH]:   "bg-orange-500 text-white border-orange-500",
  [Priority.URGENT]: "bg-red-500 text-white border-red-500",
};

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input / select shared styles ─────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-slate-400";

const errorInputClass = "border-red-300 focus:border-red-400 focus:ring-red-200";

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  service_category: string;
  priority: Priority;
  description: string;
  scheduled_date: string;
  assigned_technician_id: string;
}

const DEFAULTS: FormValues = {
  title: "",
  service_category: "",
  priority: Priority.NORMAL,
  description: "",
  scheduled_date: "",
  assigned_technician_id: "",
};

// ─── Modal component ──────────────────────────────────────────────────────────

interface NewWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (woNumber: string) => void;
}

export function NewWorkOrderModal({ open, onClose, onSuccess }: NewWorkOrderModalProps) {
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [errors, setErrors] = useState<NewWorkOrderFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successWoNumber, setSuccessWoNumber] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  // Body scroll lock + Escape key
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);

    // Auto-focus title field
    setTimeout(() => titleRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear field error on change
    if (errors[key as keyof NewWorkOrderFieldErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
    // Reset after slide-out completes
    setTimeout(() => {
      setValues(DEFAULTS);
      setErrors({});
      setSubmitError(null);
      setSuccessWoNumber(null);
    }, 300);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const result = NewWorkOrderSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        service_category: fieldErrors.service_category?.[0],
        priority: fieldErrors.priority?.[0],
        description: fieldErrors.description?.[0],
        scheduled_date: fieldErrors.scheduled_date?.[0],
        assigned_technician_id: fieldErrors.assigned_technician_id?.[0],
      });
      // Focus first errored field
      if (fieldErrors.title) titleRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Failed to create work order");
      }

      const json = (await res.json()) as { data: { wo_number: string } };
      setSuccessWoNumber(json.data.wo_number);
      onSuccess(json.data.wo_number);

      // Auto-close after showing success
      setTimeout(() => handleClose(), 1800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Slide-over drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New Work Order"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">New Work Order</h2>
            <p className="mt-0.5 text-sm text-slate-500">Fill in the job details below</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {successWoNumber ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Work order created</p>
                <p className="mt-1 font-mono text-sm font-semibold text-brand-600">{successWoNumber}</p>
                <p className="mt-1 text-sm text-slate-500">Closing in a moment…</p>
              </div>
            </div>
          ) : (
            /* Form */
            <form id="new-wo-form" onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-5">

              {/* Submit error banner */}
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Title */}
              <Field label="Job Title" htmlFor="wo-title" error={errors.title} required>
                <input
                  ref={titleRef}
                  id="wo-title"
                  type="text"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Weekly Pool Service — Rodriguez"
                  maxLength={120}
                  className={cn(inputClass, errors.title && errorInputClass)}
                  aria-describedby={errors.title ? "wo-title-error" : undefined}
                />
                <p className="text-right text-xs text-slate-400">{values.title.length}/120</p>
              </Field>

              {/* Service Category */}
              <Field label="Service Category" htmlFor="wo-category" error={errors.service_category} required>
                <select
                  id="wo-category"
                  value={values.service_category}
                  onChange={(e) => set("service_category", e.target.value)}
                  className={cn(inputClass, errors.service_category && errorInputClass)}
                >
                  <option value="" disabled>Select a category…</option>
                  {serviceTypes.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                {values.service_category && (
                  <p className="text-xs text-slate-400">
                    {serviceTypes.find((s) => s.value === values.service_category)?.description}
                  </p>
                )}
              </Field>

              {/* Priority */}
              <Field label="Priority" htmlFor="wo-priority-normal">
                <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-slate-200">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const isActive = values.priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        id={`wo-priority-${opt.value}`}
                        onClick={() => set("priority", opt.value)}
                        title={opt.urgencyHint}
                        className={cn(
                          "flex flex-col items-center border-r border-slate-200 py-2.5 text-xs font-medium last:border-r-0 transition-colors",
                          isActive ? PRIORITY_ACTIVE[opt.value] : "bg-white text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <span>{opt.label}</span>
                        <span className={cn("text-[10px] font-normal", isActive ? "opacity-80" : "text-slate-400")}>
                          {opt.urgencyHint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Description */}
              <Field label="Description" htmlFor="wo-description" error={errors.description}>
                <textarea
                  id="wo-description"
                  rows={3}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Add notes, special instructions, or access info (gate codes, dogs, etc.)…"
                  className={cn(inputClass, "resize-none", errors.description && errorInputClass)}
                />
              </Field>

              {/* Scheduled Date + Technician (2-col) */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Scheduled Date" htmlFor="wo-date" error={errors.scheduled_date}>
                  <input
                    id="wo-date"
                    type="date"
                    value={values.scheduled_date}
                    onChange={(e) => set("scheduled_date", e.target.value)}
                    className={cn(inputClass, errors.scheduled_date && errorInputClass)}
                  />
                </Field>

                <Field label="Assign Technician" htmlFor="wo-technician">
                  <select
                    id="wo-technician"
                    value={values.assigned_technician_id}
                    onChange={(e) => set("assigned_technician_id", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {MOCK_TECHNICIANS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-400">
                <strong className="text-slate-500">Phase 3:</strong> Property linking will be added when property profiles are built. For now, work orders are created without a linked property.
              </p>

            </form>
          )}
        </div>

        {/* ── Footer ── */}
        {!successWoNumber && (
          <div className="flex items-center justify-end gap-3 border-t border-border bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-wo-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Work Order"
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
