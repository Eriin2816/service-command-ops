import type { Metadata } from "next";
import { Brain } from "lucide-react";

export const metadata: Metadata = { title: "AI Knowledge Base" };

export default function AIKnowledgePage() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <Brain className="h-7 w-7 text-brand-500" />
      </div>
      <h2 className="font-display text-2xl font-bold text-slate-900">AI Knowledge Base</h2>
      <p className="mt-3 text-sm text-slate-500 leading-relaxed">
        Attach service manuals, chemical guides, and property-specific notes that the AI can reference when answering technician questions in the field.
      </p>
      <span className="mt-6 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Coming in a future update
      </span>
    </div>
  );
}
