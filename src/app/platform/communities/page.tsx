import prisma from "@/lib/db";
import { CreateCommunityForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function PlatformCommunitiesPage() {
  const communities = await prisma.community.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { adverts: true, businesses: true, members: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
      </div>
      <CreateCommunityForm />
      <div className="space-y-2">
        {communities.length === 0 ? (
          <p className="text-sm text-gray-500">No communities yet.</p>
        ) : (
          communities.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500">{c.status} · {c._count.members} members · {c._count.adverts} ads</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : c.status === "PILOT" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
