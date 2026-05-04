import type { Metadata } from "next";
import {
  ClipboardList,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Clock,
  Wrench,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "Overview" };

const PLACEHOLDER_JOBS = [
  { id: "1", address: "1842 Sunset Blvd, Anaheim, CA", type: "Weekly Maintenance", tech: "Carlos M.", status: "In Progress", statusColor: "text-brand-600 bg-brand-50" },
  { id: "2", address: "3317 Oak Ridge Dr, Garden Grove, CA", type: "Equipment Install", tech: "Derek T.", status: "Scheduled", statusColor: "text-slate-600 bg-slate-100" },
  { id: "3", address: "905 Palomar St, Escondido, CA", type: "Repair", tech: "Marcus L.", status: "Estimate Needed", statusColor: "text-amber-700 bg-amber-50" },
];

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div>
        <Breadcrumb items={[{ label: "Overview" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Good morning
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening at Showtime Pool Service today.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Jobs Today"
          value={8}
          icon={ClipboardList}
          trend={{ value: "2 more than yesterday", direction: "up" }}
          accent="brand"
        />
        <StatCard
          label="Completed"
          value={3}
          icon={CheckCircle2}
          trend={{ value: "On track", direction: "neutral" }}
          accent="green"
        />
        <StatCard
          label="Open Estimates"
          value={2}
          icon={FileText}
          trend={{ value: "Needs review", direction: "neutral" }}
          accent="amber"
        />
        <StatCard
          label="Overdue"
          value={1}
          icon={AlertTriangle}
          trend={{ value: "Requires action", direction: "down" }}
          accent="red"
        />
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's jobs */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-500" />
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Today&apos;s Jobs
                </h3>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                8 total
              </span>
            </div>
            <div className="divide-y divide-border">
              {PLACEHOLDER_JOBS.map((job) => (
                <div key={job.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Wrench className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{job.address}</p>
                    <p className="text-xs text-slate-500">{job.type} · {job.tech}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${job.statusColor}`}>
                    {job.status}
                  </span>
                </div>
              ))}
              <div className="px-5 py-3 text-center">
                <p className="text-xs text-slate-400">+ 5 more jobs — real data coming in Phase 2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-display text-sm font-semibold text-slate-900">Alerts</h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800">Estimate Needed</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  905 Palomar St — pump replacement required
                </p>
                <p className="mt-1 text-[10px] font-medium text-amber-600">
                  Flagged by Marcus L. · Today 10:24 AM
                </p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-800">Overdue Job</p>
                <p className="mt-0.5 text-xs text-red-700">
                  2210 Canyon Rd — scheduled 2 days ago
                </p>
                <p className="mt-1 text-[10px] font-medium text-red-600">
                  Unassigned · Requires attention
                </p>
              </div>
              <p className="pt-1 text-center text-[11px] text-slate-400">
                Real alerts will populate from work order data
              </p>
            </div>
          </div>

          {/* Technician status */}
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <h3 className="font-display text-sm font-semibold text-slate-900">Technicians</h3>
            </div>
            <div className="space-y-2 p-4">
              {[
                { name: "Carlos M.", status: "In Field", color: "bg-emerald-400" },
                { name: "Derek T.",  status: "In Field", color: "bg-emerald-400" },
                { name: "Marcus L.", status: "On Break", color: "bg-amber-400" },
              ].map((tech) => (
                <div key={tech.name} className="flex items-center gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${tech.color}`} />
                  <span className="flex-1 text-sm text-slate-700">{tech.name}</span>
                  <span className="text-xs text-slate-500">{tech.status}</span>
                </div>
              ))}
              <p className="pt-1 text-center text-[11px] text-slate-400">
                Live status in Phase 4
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
