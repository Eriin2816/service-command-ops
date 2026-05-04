import type { Metadata } from "next";
import { BarChart2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Reports" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-500">
          Operations KPIs, job completion rates, and technician summaries.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <BarChart2 className="h-7 w-7 text-brand-500" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-slate-900">No report data yet</p>
            <p className="mt-1 text-sm text-slate-500">
              KPI cards, job status breakdown, and technician summaries coming in Phase 7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
