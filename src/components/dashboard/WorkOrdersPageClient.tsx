"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Plus, X, Trash2, AlertCircle } from "lucide-react";
import { NewWorkOrderModal } from "./NewWorkOrderModal";
import { WorkOrdersTable, type WorkOrdersTableHandle } from "./WorkOrdersTable";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

type Toast = { type: "success" | "error" | "deleted"; message: string };

export function WorkOrdersPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const tableRef = useRef<WorkOrdersTableHandle>(null);

  function showToast(t: Toast, durationMs = 6000) {
    setToast(t);
    setTimeout(() => setToast(null), durationMs);
  }

  function handleSuccess(woNumber: string) {
    tableRef.current?.refresh();
    showToast({ type: "success", message: `${woNumber} created successfully` });
  }

  function handleDeleteSuccess(woNumber: string) {
    showToast({ type: "deleted", message: `Work order ${woNumber} deleted` });
  }

  function handleDeleteError() {
    showToast({ type: "error", message: "Failed to delete. Please try again." }, 8000);
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

      {/* Toast banner */}
      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : toast.type === "deleted"
            ? "border-slate-200 bg-slate-50 text-slate-700"
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
          {toast.type === "deleted" && <Trash2 className="h-4 w-4 shrink-0 text-slate-400" />}
          {toast.type === "error"   && <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
          <span className="font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto rounded p-0.5 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Table */}
      <WorkOrdersTable
        ref={tableRef}
        onDeleteSuccess={handleDeleteSuccess}
        onDeleteError={handleDeleteError}
      />

      {/* Modal */}
      <NewWorkOrderModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
