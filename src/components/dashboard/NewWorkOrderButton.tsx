"use client";

import { useState } from "react";
import { Plus, CheckCircle2, X } from "lucide-react";
import { NewWorkOrderModal } from "./NewWorkOrderModal";

export function NewWorkOrderButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  function handleSuccess(woNumber: string) {
    setSuccessBanner(woNumber);
    setTimeout(() => setSuccessBanner(null), 6000);
  }

  return (
    <>
      {/* Success banner — rendered in the page flow above the table */}
      {successBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            <span className="font-semibold">{successBanner}</span> created successfully (mock — not persisted to database)
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

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" />
        New Work Order
      </button>

      <NewWorkOrderModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
