import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Visits" };

export default function VisitsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Visits" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">Visits</h2>
        <p className="mt-1 text-sm text-slate-500">
          Scheduled and completed service visit history.
        </p>
      </div>

      <EmptyState
        icon={CalendarCheck}
        title="No visits yet"
        description="Visit history is recorded through the technician job flow. An admin visit history view is coming in a future update."
      />
    </div>
  );
}
