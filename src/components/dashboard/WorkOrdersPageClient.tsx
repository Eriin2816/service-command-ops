"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { NewWorkOrderModal } from "./NewWorkOrderModal";
import { WorkOrdersTable, type WorkOrdersTableHandle } from "./WorkOrdersTable";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export function WorkOrdersPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const tableRef = useRef<WorkOrdersTableHandle>(null);

  function handleSuccess(woNumber: string) {
    setSuccessBanner(woNumber);
    tableRef.current?.refresh();
    setTimeout(() => setSuccessBanner(null), 6000);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Work Orders" }]} className="mb-2" />
          <h2 className="font-display text-2xl font-bold text-slate-900">Work Orders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage all service jobs for Showtime Pool Service.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          New Work Order
        </button>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            <span className="font-semibold">{successBanner}</span> created successfully
          </span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="ml-auto rounded p-0.5 hover:bg-emerald-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Table */}
      <WorkOrdersTable ref={tableRef} />

      {/* Modal */}
      <NewWorkOrderModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
