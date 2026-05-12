import type { Metadata } from "next";
import { SettingsPageClient } from "@/components/dashboard/SettingsPageClient";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsPageClient />;
}
