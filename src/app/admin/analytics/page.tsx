import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminAnalyticsPage() {
  const area = await tryRequireAdminArea("VIEW_COMMUNITY_ANALYTICS");
  if (!area) redirect("/403");
  const { communityId } = area;
  const [adverts, views, interactions] = communityId
    ? await Promise.all([
        prisma.advert.count({ where: { communityId, deletedAt: null } }),
        prisma.advertView.aggregate({ where: { advert: { communityId } }, _sum: { count: true } }),
        prisma.advertInteraction.count({ where: { advert: { communityId } } }),
      ])
    : [0, { _sum: { count: 0 } }, 0];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Total adverts</p><p className="text-2xl font-bold text-brand-700">{adverts}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Total views</p><p className="text-2xl font-bold text-brand-700">{views._sum.count ?? 0}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Interactions</p><p className="text-2xl font-bold text-brand-700">{interactions}</p></div>
      </div>
    </div>
  );
}
