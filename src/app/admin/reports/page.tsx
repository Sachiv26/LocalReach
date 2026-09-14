import { requireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminReportsPage() {
  const { communityId } = await requireAdminArea("MODERATE_ADS");
  const reports = communityId
    ? await prisma.advertReport.findMany({ where: { advert: { communityId } }, include: { advert: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 50 })
    : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <div className="space-y-2">
        {reports.length === 0 ? <p className="text-sm text-gray-500">No reports.</p> : reports.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">{r.advert?.title}</p>
            <p className="text-xs text-gray-500">{r.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
