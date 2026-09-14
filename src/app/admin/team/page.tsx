import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminTeamPage() {
  const area = await tryRequireAdminArea("MANAGE_ADMINS");
  if (!area) redirect("/403");
  const { communityId } = area;
  const admins = communityId
    ? await prisma.communityAdmin.findMany({ where: { communityId }, include: { user: { select: { name: true, email: true } } } })
    : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Team</h1>
      <div className="space-y-2">
        {admins.length === 0 ? <p className="text-sm text-gray-500">No team members.</p> : admins.map((a) => (
          <div key={a.userId} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div><p className="font-medium text-gray-900">{a.user?.name}</p><p className="text-xs text-gray-500">{a.user?.email}</p></div>
            <span className="text-xs font-medium text-gray-600">{a.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
