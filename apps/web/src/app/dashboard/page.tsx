import { DashboardApp } from "@/components/dashboard-app";

export const dynamic = "force-static";

export default function DashboardPage() {
  return <DashboardApp initialSection="dashboard" />;
}
