import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Users, CreditCard, BarChart3, Settings, Home, LogOut } from "lucide-react";
import { getAuthContext } from "@/lib/auth/access";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const NAV = [
  { href: "/platform", label: "Overview", icon: Home },
  { href: "/platform/communities", label: "Communities", icon: Building2 },
  { href: "/platform/users", label: "Users", icon: Users },
  { href: "/platform/payments", label: "Payments", icon: CreditCard },
  { href: "/platform/revenue", label: "Revenue", icon: BarChart3 },
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  const session = await getServerSession(authOptions);
  if (!ctx.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 lg:block">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Platform</p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <item.icon className="h-4 w-4 text-gray-500" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="mb-2 px-3 text-xs text-gray-500">{session?.user?.email}</p>
          <form action="/api/auth/signout" method="GET">
            <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
