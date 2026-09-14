import Link from "next/link";
import { listAdverts } from "@/lib/ads/service";
import { requireAdminArea } from "@/lib/auth/access";
import { Pagination } from "@/components/ui/primitives";

export const metadata = { title: "Pending review · Admin" };

export default async function AdminPendingAdsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { communityId } = await requireAdminArea("MODERATE_ADS");
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const result = communityId
    ? await listAdverts({ communityId, status: "PENDING_REVIEW", page, pageSize: 20, includeAllStatuses: true, sort: "newest" })
    : { items: [] as { id: string; title: string; createdAt: Date; advertiser: { name: string | null } | null }[], total: 0, page, pageSize: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending review</h1>
        <p className="mt-1 text-sm text-gray-600">
          Adverts waiting for moderation. Approve to publish, or reject with a reason. Automated checks run on every submission.
        </p>
      </div>

      <div className="space-y-2">
        {result.items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="font-medium text-gray-900">You&apos;re all caught up 🎉</p>
            <p className="mt-1 text-sm text-gray-500">No adverts are waiting for review right now.</p>
          </div>
        ) : (
          result.items.map((a) => (
            <Link
              key={a.id}
              href={`/admin/ads/${a.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-500">
                  {a.advertiser?.name ?? "Unknown seller"} · submitted {a.createdAt.toLocaleString("en-ZA")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Review →
              </span>
            </Link>
          ))
        )}
      </div>

      <Pagination currentPage={result.page} totalPages={result.totalPages} hrefPrefix="/admin/ads/pending" />
    </div>
  );
}