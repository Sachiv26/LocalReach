import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminRulesPage() {
  const area = await tryRequireAdminArea("MANAGE_RULES");
  if (!area) redirect("/403");
  const { communityId } = area;
  const rules = communityId ? await prisma.communityRule.findMany({ where: { communityId }, orderBy: { createdAt: "asc" } }) : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Rules</h1>
      <div className="space-y-2">
        {rules.length === 0 ? <p className="text-sm text-gray-500">No rules configured.</p> : rules.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div><p className="font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-500">{r.type} · {r.severity}</p></div>
            <span className="text-xs font-medium text-gray-600">{r.enabled ? "On" : "Off"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
