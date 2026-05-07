import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";

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

      <EmptyState
        icon={FileText}
        title="No open estimates"
        description="Estimate-needed flags and GHL opportunity handoff coming in Phase 6."
        iconClassName="text-amber-500"
      />
    </div>
  );
}
