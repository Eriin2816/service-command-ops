import type { Metadata } from "next";
import { EstimatesPageClient } from "@/components/dashboard/EstimatesPageClient";

export const metadata: Metadata = { title: "Estimates" };

export default function EstimatesPage() {
  return <EstimatesPageClient />;
}
