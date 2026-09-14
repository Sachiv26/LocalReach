import { listAdverts } from "@/lib/ads/service";
import { requireAdminArea } from "@/lib/auth/access";
import Link from "next/link";

export default async function AdminAdsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const { communityId } = await requireAdminArea("MODERATE_ADS");
  const result = communityId
    ? await listAdverts({ communityId, status: searchParams.status, page: Number(searchParams.page) || 1, sort: "newest", includeAllStatuses: true })
    : { items: [] as any[], total: 0, page: 1, pageSize: 20, totalPages: 1 };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Adverts</h1>
      <div className="space-y-2">
        {result.items.length === 0 ? <p className="text-sm text-gray-500">No adverts found.</p> : result.items.map((a) => (
          <Link key={a.id} href={`/admin/ads/${a.id}`} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-brand-300">
            <div><p className="font-medium text-gray-900">{a.title}</p></div>
            <span className="text-xs font-medium text-gray-600">{a.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
