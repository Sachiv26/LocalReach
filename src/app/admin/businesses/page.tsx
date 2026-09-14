import { listBusinesses } from "@/lib/businesses/service";
import { requireAdminArea } from "@/lib/auth/access";

export default async function AdminBusinessesPage() {
  const { communityId } = await requireAdminArea("MODERATE_ADS");
  const result = communityId ? await listBusinesses({ communityId }, 1, 50) : { items: [] as any[], total: 0, page: 1, pageSize: 50, totalPages: 1 };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
      <div className="space-y-2">
        {result.items.length === 0 ? <p className="text-sm text-gray-500">No businesses yet.</p> : result.items.map((b) => (
          <div key={b.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">{b.businessName}</p>
            <p className="text-xs text-gray-500">{b.verificationStatus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
