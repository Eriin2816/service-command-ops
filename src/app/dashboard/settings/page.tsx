import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Settings" }]} className="mb-2" />
        <h2 className="font-display text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          App configuration, GHL integration credentials, and user management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "GHL Integration",   desc: "Connect your GoHighLevel account and configure webhook endpoints." },
          { title: "User Management",   desc: "Invite team members, assign roles, and manage access permissions." },
          { title: "Notifications",     desc: "Configure alert rules and notification preferences." },
          { title: "Service Templates", desc: "Manage job checklist templates for each service type." },
          { title: "Tenant Settings",   desc: "Business name, address, and billing configuration." },
        ].map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Settings className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-slate-900">{section.title}</p>
                <p className="mt-1 text-xs text-slate-500">{section.desc}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
