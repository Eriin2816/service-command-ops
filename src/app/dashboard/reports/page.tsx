import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ReportsDashboard } from "@/components/dashboard/ReportsDashboard";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.tenant_id) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl space-y-6 print:max-w-none print:space-y-4">
      <div className="print:hidden">
        <Breadcrumb items={[{ label: "Reports" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-500">
          Work order KPIs, status breakdown, and technician summaries.
        </p>
      </div>
      <ReportsDashboard tenantId={session.user.tenant_id} />
    </div>
  );
}
