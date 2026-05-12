import type { Metadata } from "next";
import { WorkOrdersPageClient } from "@/components/dashboard/WorkOrdersPageClient";

export const metadata: Metadata = { title: "Work Orders" };

export default function WorkOrdersPage() {
  return <WorkOrdersPageClient />;
}
