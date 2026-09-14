import Link from "next/link";
import { listAdverts } from "@/lib/ads/service";
import { requireAdminArea } from "@/lib/auth/access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";

export default async function AdminPage() {
  const { communities, communityId } = await requireAdminArea();
  const pending = communityId ? await listAdverts({ communityId, status: "PENDING_REVIEW", page: 1, pageSize: 5 }) : { items: [], total: 0 };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-base font-semibold text-gray-900">Pending</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-brand-700">{pending.total}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base font-semibold text-gray-900">Communities</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-brand-700">{communities.length}</p></CardContent></Card>
      </div>
    </div>
  );
}
