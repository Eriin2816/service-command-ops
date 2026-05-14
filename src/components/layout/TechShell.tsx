import { Droplets } from "lucide-react";
import { InstallPromptBanner } from "./InstallPromptBanner";

interface TechShellProps {
  children: React.ReactNode;
}

export function TechShell({ children }: TechShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between px-4"
        style={{ backgroundColor: "#0C1E2E" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500">
            <Droplets className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight text-white">
            ServiceOps
          </span>
        </div>

        {/* Tech identity */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">Carlos M.</p>
            <p className="text-[10px] font-medium text-slate-400">Technician</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            C
          </div>
        </div>
      </header>

      <InstallPromptBanner />

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
