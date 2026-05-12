"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { X, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { CreateTechnicianSchema, type CreateTechnicianFieldErrors } from "@/lib/validation/technician";
import { cn } from "@/lib/utils";

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-slate-400";

const errorInputClass = "border-red-300 focus:border-red-400 focus:ring-red-200";

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const DEFAULTS: FormValues = { name: "", email: "", phone: "", password: "" };

// ─── Modal component ──────────────────────────────────────────────────────────

interface NewTechnicianModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

export function NewTechnicianModal({ open, onClose, onSuccess }: NewTechnicianModalProps) {
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [errors, setErrors] = useState<CreateTechnicianFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    setTimeout(() => nameRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
    setTimeout(() => {
      setValues(DEFAULTS);
      setErrors({});
      setSubmitError(null);
      setSuccessName(null);
      setShowPassword(false);
    }, 300);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const result = CreateTechnicianSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name:     fieldErrors.name?.[0],
        email:    fieldErrors.email?.[0],
        phone:    fieldErrors.phone?.[0],
        password: fieldErrors.password?.[0],
      });
      if (fieldErrors.name) nameRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Failed to create technician");
      }

      const json = (await res.json()) as { data: { name: string } };
      setSuccessName(json.data.name);
      onSuccess(json.data.name);
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
        aria-label="Add Technician"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Add Technician</h2>
            <p className="mt-0.5 text-sm text-slate-500">Create a new technician login account</p>
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
          {successName ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Technician added</p>
                <p className="mt-1 text-sm font-semibold text-brand-600">{successName}</p>
                <p className="mt-1 text-sm text-slate-500">Closing in a moment…</p>
              </div>
            </div>
          ) : (
            <form id="new-tech-form" onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-5">

              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Full Name */}
              <Field label="Full Name" htmlFor="tech-name" error={errors.name} required>
                <input
                  ref={nameRef}
                  id="tech-name"
                  type="text"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Marcus Johnson"
                  maxLength={120}
                  className={cn(inputClass, errors.name && errorInputClass)}
                />
              </Field>

              {/* Email */}
              <Field label="Email Address" htmlFor="tech-email" error={errors.email} required
                hint="Used to log in to the technician mobile view">
                <input
                  id="tech-email"
                  type="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="e.g. marcus@showtimepools.com"
                  maxLength={200}
                  className={cn(inputClass, errors.email && errorInputClass)}
                />
              </Field>

              {/* Phone */}
              <Field label="Phone" htmlFor="tech-phone" error={errors.phone}
                hint="Optional — shown on work order assignments">
                <input
                  id="tech-phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="e.g. (619) 555-0123"
                  maxLength={30}
                  className={cn(inputClass, errors.phone && errorInputClass)}
                />
              </Field>

              {/* Password */}
              <Field label="Password" htmlFor="tech-password" error={errors.password} required
                hint="Technician will use this to log in to the mobile app">
                <div className="relative">
                  <input
                    id="tech-password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min 8 characters"
                    maxLength={128}
                    className={cn(inputClass, "pr-10", errors.password && errorInputClass)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {/* Role — locked */}
              <Field label="Role" htmlFor="tech-role">
                <select
                  id="tech-role"
                  disabled
                  className={cn(inputClass, "cursor-not-allowed")}
                  value="technician"
                  onChange={() => {}}
                >
                  <option value="technician">Technician</option>
                </select>
                <p className="text-xs text-slate-400">Additional roles can be assigned in settings.</p>
              </Field>

            </form>
          )}
        </div>

        {/* ── Footer ── */}
        {!successName && (
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
              form="new-tech-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Add Technician"
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
