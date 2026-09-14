import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthContext, getAdministeredCommunities } from "@/lib/auth/access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  const communities = await getAdministeredCommunities();
  if (!ctx.isSuperAdmin && communities.length === 0) redirect("/dashboard");
  return <DashboardShell navMode="admin">{children}</DashboardShell>;
}
