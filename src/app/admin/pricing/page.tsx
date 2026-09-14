import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminPricingPage() {
  const area = await tryRequireAdminArea("MANAGE_PRICING");
  if (!area) redirect("/403");
  const { communityId } = area;
  const plans = communityId
    ? await prisma.pricingPlan.findMany({ where: { OR: [{ communityId }, { communityId: null }] }, orderBy: { price: "asc" } })
    : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
      <div className="space-y-2">
        {plans.length === 0 ? <p className="text-sm text-gray-500">No pricing plans.</p> : plans.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.planKey} · {p.billingPeriod}</p></div>
            <span className="text-sm font-semibold text-brand-700">R{Number(p.price).toLocaleString("en-ZA")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
