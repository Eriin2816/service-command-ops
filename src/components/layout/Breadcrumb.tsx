import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit for the current (last) segment — rendered as plain text
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-xs", className)}
    >
      {/* Home anchor always links to overview */}
      <Link
        href="/dashboard/overview"
        className="flex items-center text-slate-400 transition-colors hover:text-slate-600"
        aria-label="Dashboard home"
      >
        <Home className="h-3 w-3" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />
            {isLast || !item.href ? (
              <span
                className={cn(
                  "font-medium",
                  isLast ? "text-slate-700" : "text-slate-400"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
