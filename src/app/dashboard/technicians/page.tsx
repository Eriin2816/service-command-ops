import type { Metadata } from "next";
import { Users, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";

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

      <EmptyState
        icon={Users}
        title="No technicians yet"
        description="Technician profiles and role assignments coming in Phase 2."
      />
    </div>
  );
}
