"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { LayoutDashboard, Tag, PlusCircle, Store, Heart, CreditCard, Bell, Settings, Shield, Users, BarChart3, Receipt, FileText, LogOut, ClipboardCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/ads", label: "My adverts", icon: Tag },
  { href: "/dashboard/ads/new", label: "Post an advert", icon: PlusCircle },
  { href: "/dashboard/business", label: "My business", icon: Store },
  { href: "/dashboard/saved", label: "Saved adverts", icon: Heart },
  { href: "/dashboard/payments", label: "Payments & boosts", icon: CreditCard },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Account settings", icon: Settings },
];

/** Moderation links shown to community moderators/admins on the member dashboard. */
const moderationNav = [
  { href: "/admin", label: "Admin overview", icon: Shield, exact: false },
  { href: "/admin/ads/pending", label: "Pending review", icon: ClipboardCheck, exact: false },
  { href: "/admin/reports", label: "Reports", icon: FileText, exact: false },
];

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/ads/pending", label: "Pending review", icon: ClipboardCheck },
  { href: "/admin/ads", label: "Adverts", icon: Tag },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/businesses", label: "Businesses", icon: Store },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/rules", label: "Rules", icon: Shield },
  { href: "/admin/pricing", label: "Pricing", icon: Receipt },
  { href: "/admin/revenue", label: "Revenue", icon: BarChart3 },
  { href: "/admin/payouts", label: "Payouts", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/audit-log", label: "Audit log", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/partnership", label: "Partnership", icon: Users },
];

/** Subset of the admin nav appropriate for moderators (MODERATE_ADS scope). */
export const moderatorNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/ads/pending", label: "Pending review", icon: ClipboardCheck },
  { href: "/admin/ads", label: "Adverts", icon: Tag },
  { href: "/admin/reports", label: "Reports", icon: FileText },
];

export const platformNav = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/platform/communities", label: "Communities", icon: Users },
  { href: "/platform/users", label: "Users", icon: Users },
  { href: "/platform/payments", label: "Payments", icon: CreditCard },
  { href: "/platform/revenue", label: "Revenue", icon: BarChart3 },
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

function NavList({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      <div className="hidden flex-col gap-1 lg:flex">
        {items.map((item) => {
          const active = item.exact ? path === item.href : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                active ? "bg-brand-50 text-brand-800" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden /> {item.label}
            </Link>
          );
        })}
      </div>
      <div className="lg:hidden flex flex-col gap-1 border-t border-gray-100 pt-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}

export function DashNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const items = isAdmin ? [...moderationNav, ...nav] : nav;
  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard navigation">
      {isAdmin ? (
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Moderation</p>
      ) : null}
      <NavList items={items} />
      <SignOutItem />
    </nav>
  );
}

export function AdminNav({ role }: { role?: string }) {
  const items = role === "MODERATOR" ? moderatorNav : adminNav;
  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>
      <NavList items={items} />
      <SignOutItem />
    </div>
  );
}

export function PlatformNav() {
  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Platform</p>
      <NavList items={platformNav} />
      <SignOutItem />
    </div>
  );
}

function SignOutItem() {
  return (
    <>
      <div className="hidden lg:block pt-3 mt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </div>
      <div className="lg:hidden border-t border-gray-100 pt-2">
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          Sign out
        </button>
      </div>
    </>
  );
}