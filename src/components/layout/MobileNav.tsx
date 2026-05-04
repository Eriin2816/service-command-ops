"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 h-full animate-slide-in-left">
        <div className="relative h-full">
          <Sidebar />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:outline-none"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
