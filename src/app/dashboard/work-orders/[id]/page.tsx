import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_WORK_ORDERS } from "@/lib/mock-data/work-orders";
import { WorkOrderDetail } from "@/components/dashboard/WorkOrderDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const wo = MOCK_WORK_ORDERS.find((w) => w.id === id);
  if (!wo) return { title: "Work Order Not Found" };
  return { title: `${wo.wo_number} – ${wo.title}` };
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const workOrder = MOCK_WORK_ORDERS.find((w) => w.id === id);

  if (!workOrder) notFound();

  return <WorkOrderDetail workOrder={workOrder} />;
}
