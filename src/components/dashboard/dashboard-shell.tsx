import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { getQuotaStatus } from "@/lib/ads/service";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashNav, AdminNav, PlatformNav } from "@/components/dashboard/dash-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export type NavMode = "user" | "admin" | "platform";

export async function DashboardShell({ children, navMode = "user" }: { children: React.ReactNode; navMode?: NavMode }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: userId as string },
    select: { name: true, email: true },
  });
  const memberships = await prisma.communityMember.findMany({
    where: { userId },
    include: { community: true },
  });
  const community = memberships[0]?.community;
  const quota = community ? await getQuotaStatus(userId as string, community) : null;
  const adminMembership = await prisma.communityAdmin.findFirst({ where: { userId } });
  const isAdmin = Boolean(adminMembership);
  const adminRole = adminMembership?.role ?? "COMMUNITY_ADMIN";

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="container-page flex h-14 items-center justify-between">
          <Link href="/" className="font-bold text-gray-900">Local<span className="text-brand-600">Reach</span></Link>
          <nav className="flex items-center gap-3 text-sm" aria-label="Account">
            <span className="hidden font-medium text-gray-900 sm:inline">{user?.name ?? user?.email}</span>
            {isAdmin ? <Link href="/admin" className="font-semibold text-brand-700">Admin →</Link> : null}
            <SignOutButton />
            <Link href="/" className="text-gray-500">← Site</Link>
          </nav>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[230px_1fr]">
        {navMode === "admin" ? <AdminNav role={adminRole} /> : navMode === "platform" ? <PlatformNav /> : <DashNav isAdmin={isAdmin} />}
        <div className="min-w-0">
          {community ? (
            <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
              <p className="font-medium text-brand-900">
                Free advertising: {quota?.used ?? 0} of {community.freeAdLimit} used this period
              </p>
              <p className="mt-0.5 text-xs text-brand-800">
                {quota && quota.remaining > 0
                  ? `${quota.remaining} free advert${quota.remaining === 1 ? "" : "s"} remaining.`
                  : quota?.resetAt
                    ? `Next free advert unlocks ${quota.resetAt.toLocaleDateString("en-ZA")}.`
                    : "No free adverts remaining."}
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-500">
              Join a community to see your free advertising quota.
              <Link href="/community/umgeni-park-durban-north" className="font-medium text-brand-700"> Browse communities →</Link>
            </div>
          )}
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}