import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <Breadcrumb items={[{ label: "Overview" }]} />
      <OverviewDashboard />
    </div>
  );
}
