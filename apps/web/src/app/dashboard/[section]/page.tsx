import { notFound } from "next/navigation";
import { DashboardApp } from "@/components/dashboard-app";

const allowed = ["domains", "expirations", "renewals", "notifications", "assignments", "users", "reports", "costs", "audit-log", "settings"] as const;
type AllowedSection = (typeof allowed)[number];

export const dynamic = "force-static";

export function generateStaticParams() {
  return allowed.map((section) => ({ section }));
}

export default async function DashboardSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!allowed.includes(section as AllowedSection)) notFound();
  return <DashboardApp initialSection={section as AllowedSection} />;
}
