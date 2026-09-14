"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, MessageCircleHeart, Search, LayoutDashboard, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { LinkButton } from "@/components/ui/button";

const links = [
  { href: "/ads", label: "Browse Ads" },
  { href: "/businesses", label: "Businesses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/safety", label: "Safety" },
];

export function SiteHeader() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const roles = session?.user?.roles ?? [];
  const isAdminArea =
    roles.includes("COMMUNITY_OWNER") ||
    roles.includes("COMMUNITY_ADMIN") ||
    roles.includes("MODERATOR") ||
    roles.includes("SUPER_ADMIN") ||
    roles.includes("PLATFORM_MODERATOR");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <MessageCircleHeart className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg tracking-tight">
            Local<span className="text-brand-600">Reach</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname.startsWith(l.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LinkButton href="/search" variant="ghost" size="sm" aria-label="Search">
            <Search className="h-4 w-4" />
          </LinkButton>
          {session?.user ? (
            <>
              {isAdminArea ? (
                <LinkButton href="/admin" variant="outline" size="sm">
                  <Shield className="h-4 w-4" /> Admin
                </LinkButton>
              ) : null}
              <LinkButton href="/dashboard" variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </LinkButton>
              <LinkButton href="/dashboard/ads/new" size="sm">
                Post an Advert
              </LinkButton>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Sign in
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Advertise Locally
              </LinkButton>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 border-t border-gray-100" />
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  My Dashboard
                </Link>
                {isAdminArea ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Community Admin
                  </Link>
                ) : null}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 py-2">
                <LinkButton href="/login" variant="outline" className="flex-1">
                  Sign in
                </LinkButton>
                <LinkButton href="/register" className="flex-1">
                  Register
                </LinkButton>
              </div>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
