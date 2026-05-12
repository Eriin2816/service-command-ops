"use client";

import { useRef, useState } from "react";
import { Plus, CheckCircle2, X } from "lucide-react";
import { PropertiesTable, type PropertiesTableHandle } from "./PropertiesTable";
import { NewPropertyModal } from "./NewPropertyModal";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export function PropertiesPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const tableRef = useRef<PropertiesTableHandle>(null);

  function handleSuccess(_id: string, name: string) {
    setSuccessBanner(name);
    tableRef.current?.refresh();
    setTimeout(() => setSuccessBanner(null), 6000);
  }

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

        <div className="flex shrink-0 flex-col items-end gap-2">
          {successBanner && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                <span className="font-semibold">{successBanner}</span> added successfully
              </span>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="ml-1 rounded p-0.5 hover:bg-emerald-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </button>
        </div>
      </div>

      <PropertiesTable ref={tableRef} />

      <NewPropertyModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
