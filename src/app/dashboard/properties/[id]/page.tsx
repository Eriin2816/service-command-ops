import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_PROPERTIES } from "@/lib/mock-data/properties";
import { MOCK_WORK_ORDERS } from "@/lib/mock-data/work-orders";
import { PropertyDetail } from "@/components/dashboard/PropertyDetail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find((p) => p.id === id);
  return { title: property ? `${property.customer_name} — Property` : "Property Not Found" };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find((p) => p.id === id);
  if (!property) notFound();

  const relatedWorkOrders = MOCK_WORK_ORDERS.filter((wo) => wo.property_id === id);

  return <PropertyDetail property={property} relatedWorkOrders={relatedWorkOrders} />;
}
