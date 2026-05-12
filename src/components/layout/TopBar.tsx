"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./NotificationDropdown";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/overview":    "Overview",
  "/dashboard/work-orders": "Work Orders",
  "/dashboard/properties":  "Properties",
  "/dashboard/technicians": "Technicians",
  "/dashboard/visits":      "Visits",
  "/dashboard/estimates":   "Estimates",
  "/dashboard/reports":     "Reports",
  "/dashboard/settings":    "Settings",
};

function getPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  const match = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key + "/")
  );
  return match ? match[1] : "Dashboard";
}

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white px-4 md:px-6">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuClick}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500",
          "transition-colors hover:bg-slate-100 hover:text-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          "md:hidden"
        )}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="font-display text-lg font-semibold text-slate-900">
        {title}
      </h1>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <NotificationDropdown />

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            A
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium text-slate-900">Admin</span>
            <span className="text-xs text-slate-500">Tenant Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
