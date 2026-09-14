import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminUsersPage() {
  const area = await tryRequireAdminArea("SUSPEND_USER");
  if (!area) redirect("/403");
  const { communityId } = area;
  const users = communityId
    ? await prisma.communityMember.findMany({ where: { communityId }, include: { user: { select: { name: true, email: true, createdAt: true } } }, orderBy: { joinedAt: "desc" }, take: 50 })
    : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Members</h1>
      <div className="space-y-2">
        {users.length === 0 ? <p className="text-sm text-gray-500">No members yet.</p> : users.map((m) => (
          <div key={m.userId} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">{m.user?.name}</p>
            <p className="text-xs text-gray-500">{m.user?.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
