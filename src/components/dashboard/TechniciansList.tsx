"use client";

import { forwardRef, useImperativeHandle } from "react";
import { User, Smartphone, Mail, Phone } from "lucide-react";
import { useApiQuery } from "@/lib/utils/useApiQuery";
import { ErrorState } from "@/components/ui/ErrorState";

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface TechniciansListHandle {
  refresh: () => void;
}

export const TechniciansList = forwardRef<TechniciansListHandle>(function TechniciansList(_, ref) {
  const { data, error, loading, retry } = useApiQuery<Technician[]>("/api/technicians");
  const technicians = data ?? [];

  useImperativeHandle(ref, () => ({ refresh: retry }), [retry]);

  if (error) return <ErrorState message={error} onRetry={retry} />;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-0">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (technicians.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white py-16 text-center shadow-sm">
        <User className="h-10 w-10 text-slate-200" />
        <p className="text-sm font-medium text-slate-500">No technicians yet</p>
        <p className="text-xs text-slate-400">Add your first technician to start assigning jobs.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-slate-50/60 px-6 py-3">
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{technicians.length}</span>{" "}
          {technicians.length === 1 ? "technician" : "technicians"}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {technicians.map((tech) => (
          <li key={tech.id} className="flex items-center gap-4 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
              {tech.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{tech.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Mail className="h-3 w-3" />
                  {tech.email}
                </span>
                {tech.phone ? (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Phone className="h-3 w-3" />
                    {tech.phone}
                  </span>
                ) : null}
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Smartphone className="h-3 w-3" />
                  Mobile access
                </span>
              </div>
            </div>

            <span className="ml-auto shrink-0 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Active
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
