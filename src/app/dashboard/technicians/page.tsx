import type { Metadata } from "next";
import { Users, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "Technicians" };

export default function TechniciansPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Technicians" }]} className="mb-2" />
          <h2 className="font-display text-2xl font-bold text-slate-900">Technicians</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage field technicians and job assignments.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Plus className="h-4 w-4" />
          Add Technician
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Users className="h-7 w-7 text-brand-500" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-slate-900">No technicians yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Technician profiles and role assignments coming in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
