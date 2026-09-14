"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Heart, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ads", label: "Search", icon: Search },
  { href: "/dashboard/ads/new", label: "Post", icon: PlusCircle, primary: true },
  { href: "/dashboard/saved", label: "Saved", icon: Heart },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/platform")) {
    return null;
  }
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-2"
                aria-label={item.label}
              >
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-gray-600">
                  {item.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                active ? "text-brand-700" : "text-gray-500"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-red-600"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Sign out
        </button>
      </div>
    </nav>
  );
}
