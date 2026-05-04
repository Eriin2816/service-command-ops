import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PropertiesTable } from "@/components/dashboard/PropertiesTable";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Properties" }]} className="mb-2" />
          <h2 className="font-display text-2xl font-bold text-slate-900">Properties</h2>
          <p className="mt-1 text-sm text-slate-500">
            Service addresses, pool equipment records, and access notes.
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      <PropertiesTable />
    </div>
  );
}
