import type { Metadata } from "next";
import { PropertiesPageClient } from "@/components/dashboard/PropertiesPageClient";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesPage() {
  return <PropertiesPageClient />;
}
