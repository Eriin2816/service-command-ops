import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { WorkOrdersTable } from "@/components/dashboard/WorkOrdersTable";
import { NewWorkOrderButton } from "@/components/dashboard/NewWorkOrderButton";

export const metadata: Metadata = { title: "Work Orders" };

export default function WorkOrdersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Work Orders" }]} className="mb-2" />
          <h2 className="font-display text-2xl font-bold text-slate-900">Work Orders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage all service jobs for Showtime Pool Service.
          </p>
        </div>
        <NewWorkOrderButton />
      </div>

      <WorkOrdersTable />
    </div>
  );
}
