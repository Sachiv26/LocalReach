import { redirect } from "next/navigation";
import { getEffectiveSplitRule } from "@/lib/revenue/split";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminRevenuePage() {
  const area = await tryRequireAdminArea("VIEW_REVENUE");
  if (!area) redirect("/403");
  const { communityId } = area;
  const rule = communityId ? await getEffectiveSplitRule(communityId) : null;
  const payments = communityId ? await prisma.payment.findMany({ where: { communityId, status: "PAID" }, orderBy: { createdAt: "desc" }, take: 20 }) : [];
  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Total paid</p><p className="text-2xl font-bold text-brand-700">R{total.toLocaleString("en-ZA")}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Community share</p><p className="text-2xl font-bold text-brand-700">{rule?.communityPercentage ?? 30}%</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">Transactions</p><p className="text-2xl font-bold text-brand-700">{payments.length}</p></div>
      </div>
    </div>
  );
}
