import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminPayoutsPage() {
  const area = await tryRequireAdminArea("VIEW_REVENUE");
  if (!area) redirect("/403");
  const { communityId } = area;
  const payouts = communityId ? await prisma.communityPayout.findMany({ where: { communityId }, orderBy: { createdAt: "desc" }, take: 20 }) : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
      <div className="space-y-2">
        {payouts.length === 0 ? <p className="text-sm text-gray-500">No payouts yet.</p> : payouts.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">R{Number(p.amount).toLocaleString("en-ZA")}</p>
            <span className="text-xs font-medium text-gray-600">{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
