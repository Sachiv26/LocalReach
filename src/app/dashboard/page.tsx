import Link from "next/link";
import { Tag, Store, CreditCard, Megaphone, ArrowRight } from "lucide-react";
import prisma from "@/lib/db";
import { StatCard } from "@/components/ui/primitives";
import { requireAuth } from "@/lib/auth/access";

export const metadata = { title: "Dashboard", description: "Your LocalReach dashboard." };

export default async function DashboardOverviewPage() {
  const ctx = await requireAuth();
  const userId = ctx.userId!;

  const [ads, adsForMonth, businesses, payments, notifications] = await Promise.all([
    prisma.advert.count({ where: { advertiserId: userId, deletedAt: null } }),
    prisma.advert.count({
      where: {
        advertiserId: userId,
        deletedAt: null,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.businessProfile.findFirst({ where: { ownerId: userId } }),
    prisma.payment.count({ where: { userId, status: "PAID" } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  const businessesCount = businesses ? 1 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your adverts, business profile and boosts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My adverts" value={ads} hint={`${adsForMonth} posted this month`} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="My business" value={businessesCount ? "Listed" : "—"} hint={businesses ? businesses.businessName : "Add your business"} icon={<Store className="h-5 w-5" />} />
        <StatCard label="Paid boosts" value={payments} hint="All-time paid transactions" icon={<CreditCard className="h-5 w-5" />} />
        <StatCard label="Unread notifications" value={notifications} icon={<Megaphone className="h-5 w-5" />} tone={notifications ? "amber" : "green"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link href="/dashboard/ads" className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-300">
          <div>
            <p className="font-semibold text-gray-900">My adverts</p>
            <p className="text-sm text-gray-500">View, edit and boost your adverts.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-600" />
        </Link>
        <Link href="/dashboard/ads/new" className="group flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-5 hover:border-brand-400">
          <div>
            <p className="font-semibold text-brand-900">Post a new advert</p>
            <p className="text-sm text-brand-800">Starts free — community rules are checked automatically.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-brand-600" />
        </Link>
      </div>

      {notifications > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <Link href="/dashboard/notifications" className="font-medium text-amber-900 hover:underline">
            You have {notifications} unread notification{notifications === 1 ? "" : "s"} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}