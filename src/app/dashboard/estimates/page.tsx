import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "Estimates" };

export default function EstimatesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Estimates" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">Estimates</h2>
        <p className="mt-1 text-sm text-slate-500">
          Jobs flagged by technicians as needing an estimate — handoff to GHL.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <FileText className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-slate-900">No open estimates</p>
            <p className="mt-1 text-sm text-slate-500">
              Estimate-needed flags and GHL opportunity handoff coming in Phase 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
