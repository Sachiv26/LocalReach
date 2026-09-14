import { getEffectiveSplitRule } from "@/lib/revenue/split";
import { requireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PartnershipPage() {
  const { communities } = await requireAdminArea();
  const community = communities[0];

  let split = { platformPercentage: 70, communityPercentage: 30 };
  if (community) {
    split = await getEffectiveSplitRule(community.id);
  }

  const stats = community
    ? {
        ads: await prisma.advert.count({ where: { communityId: community.id, status: "PUBLISHED", deletedAt: null } }),
        businesses: await prisma.businessProfile.count({ where: { communityId: community.id, deletedAt: null } }),
        paid: await prisma.payment.count({ where: { communityId: community.id, status: "PAID" } }),
      }
    : { ads: 0, businesses: 0, paid: 0 };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-8 text-white">
        <h1 className="text-3xl font-bold">Run your community with LocalReach</h1>
        <p className="mt-2 text-brand-100">You do not have to abandon WhatsApp. You keep your existing community. LocalReach handles the administration and creates additional advertising opportunities.</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-700">
          <li className="flex gap-2"><span className="font-bold text-brand-700">1.</span> Your WhatsApp group stays exactly as it is.</li>
          <li className="flex gap-2"><span className="font-bold text-brand-700">2.</span> Members continue to enjoy free advertising in the group.</li>
          <li className="flex gap-2"><span className="font-bold text-brand-700">3.</span> LocalReach adds a searchable marketplace, business directory, and paid boosts.</li>
          <li className="flex gap-2"><span className="font-bold text-brand-700">4.</span> You earn <strong>{split.communityPercentage}%</strong> of paid advertising revenue.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Your community snapshot</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div><p className="text-xs text-gray-500">Live adverts</p><p className="text-xl font-bold">{stats.ads}</p></div>
          <div><p className="text-xs text-gray-500">Businesses</p><p className="text-xl font-bold">{stats.businesses}</p></div>
          <div><p className="text-xs text-gray-500">Paid boosts</p><p className="text-xl font-bold">{stats.paid}</p></div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Revenue sharing</h2>
        <p className="mt-2 text-sm text-gray-600">For every paid boost or business subscription in your community:</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-brand-50 p-4"><p className="text-xs text-brand-700">Platform</p><p className="text-2xl font-bold text-brand-800">{split.platformPercentage}%</p></div>
          <div className="rounded-lg bg-green-50 p-4"><p className="text-xs text-green-700">Community</p><p className="text-2xl font-bold text-green-800">{split.communityPercentage}%</p></div>
        </div>
      </section>
    </div>
  );
}
