import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

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

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <CalendarCheck className="h-7 w-7 text-brand-500" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-slate-900">No visits yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Recurring service schedules and visit history coming in Phase 3.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
