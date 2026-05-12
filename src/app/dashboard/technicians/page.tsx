import type { Metadata } from "next";
import { TechniciansPageClient } from "@/components/dashboard/TechniciansPageClient";

export const metadata: Metadata = { title: "Technicians" };

export default function TechniciansPage() {
  return <TechniciansPageClient />;
}
