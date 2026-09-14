import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { adverts: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <p className="font-medium text-gray-900">{u.name ?? "No name"}</p>
              <p className="text-xs text-gray-500">{u.email} · {u._count.adverts} ads</p>
            </div>
            {u.bannedAt ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Banned</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
