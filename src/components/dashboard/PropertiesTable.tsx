"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  X,
  MapPin,
  Wrench,
  ClipboardList,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PropertyWithRelations } from "@/types/property";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ActiveFilter = "all" | "active" | "inactive";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }, (_, i) => (
        <TableCell key={i}>
          <div className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${50 + (i % 4) * 15}%` }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertiesTable() {
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/properties");
      const json = (await r.json()) as { data?: PropertyWithRelations[]; error?: string };
      if (json.error) {
        setError(json.error);
      } else {
        setProperties(json.data ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return properties.filter((p) => {
      if (activeFilter === "active" && !p.is_active) return false;
      if (activeFilter === "inactive" && p.is_active) return false;
      if (q) {
        const haystack = `${p.customer_name} ${p.address_line1} ${p.city}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [properties, search, activeFilter]);

  const hasFilters = search !== "" || activeFilter !== "all";
  const total = properties.length;

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

  if (error) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchProperties()}
          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-slate-50/60 px-4 py-3">

        {/* Result count */}
        <p className="text-sm text-slate-500">
          {loading ? (
            <span className="inline-block h-3 w-24 animate-pulse rounded bg-slate-200" />
          ) : hasFilters ? (
            <>
              <span className="font-medium text-slate-700">{filtered.length}</span>
              {" of "}
              <span className="font-medium text-slate-700">{total}</span>
              {" properties"}
            </>
          ) : (
            <>
              <span className="font-medium text-slate-700">{total}</span>
              {" properties"}
            </>
          )}
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or address…"
              className="w-56 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              aria-label="Search properties"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Active/inactive filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
            className={selectClass}
            aria-label="Filter by active status"
          >
            <option value="all">All Properties</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Clear all */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setActiveFilter("all"); }}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <Table>
        <TableHeader>
          <TableRow className="bg-white hover:bg-white">
            <TableHead>Customer</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="w-36">City</TableHead>
            <TableHead className="w-36">Work Orders</TableHead>
            <TableHead className="w-32">Last Service</TableHead>
            <TableHead className="w-24 text-center">Equipment</TableHead>
            <TableHead className="w-24">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="h-8 w-8 text-slate-200" />
                  <p className="text-sm font-medium text-slate-400">
                    {total === 0 ? "No properties yet." : "No properties found"}
                  </p>
                  {hasFilters && total > 0 && (
                    <p className="text-xs text-slate-400">
                      Try adjusting your search or filter.
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((prop) => {
              const hasEquipment = !!prop.pool_equipment;
              const woCount = prop.active_work_order_count;

              return (
                <TableRow key={prop.id}>

                  {/* Customer name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {prop.customer_name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/properties/${prop.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
                        >
                          {prop.customer_name}
                        </Link>
                        {prop.ghl_contact_id && (
                          <p className="mt-0.5 flex items-center gap-0.5 text-xs text-slate-400">
                            <ExternalLink className="h-2.5 w-2.5" />
                            GHL linked
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Address */}
                  <TableCell>
                    <p className="text-sm text-slate-700">{prop.address_line1}</p>
                    {prop.address_line2 && (
                      <p className="text-xs text-slate-400">{prop.address_line2}</p>
                    )}
                  </TableCell>

                  {/* City */}
                  <TableCell className="text-sm text-slate-600">
                    {prop.city}, {prop.state}
                  </TableCell>

                  {/* Work orders count */}
                  <TableCell>
                    {woCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        <ClipboardList className="h-3 w-3" />
                        {woCount} active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                        <ClipboardList className="h-3 w-3" />
                        None
                      </span>
                    )}
                  </TableCell>

                  {/* Last service date */}
                  <TableCell className="text-sm text-slate-500">
                    {prop.last_service_date ? (
                      <span title={`Last: ${prop.last_service_technician_name ?? "unknown"}`}>
                        {formatDate(prop.last_service_date)}
                      </span>
                    ) : (
                      <span className="text-slate-300">No record</span>
                    )}
                  </TableCell>

                  {/* Equipment filled indicator */}
                  <TableCell className="text-center">
                    {hasEquipment ? (
                      <span
                        title="Equipment data on file"
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        <Wrench className="h-3 w-3" />
                        On file
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </TableCell>

                  {/* Active status */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        prop.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {prop.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
