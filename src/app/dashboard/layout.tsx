import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthContext } from "@/lib/auth/access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  // Super admins go to platform; community admins go to admin. Regular users
  // and moderators without admin roles stay on the member dashboard.
  if (ctx.isSuperAdmin) redirect("/platform");
  if (ctx.roles.some((r) => ["COMMUNITY_OWNER", "COMMUNITY_ADMIN"].includes(r))) {
    redirect("/admin");
  }
  return <DashboardShell>{children}</DashboardShell>;
}
