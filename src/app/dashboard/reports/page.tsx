import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ReportsDashboard } from "@/components/dashboard/ReportsDashboard";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 print:max-w-none print:space-y-4">
      <div className="print:hidden">
        <Breadcrumb items={[{ label: "Reports" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-500">
          Work order KPIs, status breakdown, and technician summaries.
        </p>
      </div>
      <ReportsDashboard tenantId="tenant-showtime" />
    </div>
  );
}
