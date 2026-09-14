import Link from "next/link";
import { Store, Phone, MessageCircle, MapPin } from "lucide-react";
import { PubShell } from "@/components/layout/pub-shell";
import { VerifiedBadge } from "@/components/ads/ad-card";
import { listBusinesses } from "@/lib/businesses/service";

export const metadata = {
  title: "Business Directory",
  description: "Discover and contact local businesses in your community.",
};

export default async function BusinessesPage() {
  const { items, total, page, totalPages } = await listBusinesses(
    { communityId: undefined },
    1,
    24
  );

  return (
    <PubShell>
      <main className="container-page py-8">
        <h1 className="text-2xl font-bold text-gray-900">Business Directory</h1>
        <p className="mt-1 text-sm text-gray-500">{total} local businesses near you</p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="font-semibold text-gray-900">No businesses listed yet</p>
            <p className="mt-1 text-sm text-gray-500">Own a local business? Add it to the directory.</p>
            <Link href="/dashboard/business" className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white">Add your business</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <Link key={b.id} href={`/businesses/${b.slug}`} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-2xl">🏪</div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-brand-700">{b.businessName}</p>
                    <p className="text-xs text-gray-500">{b.suburb ?? b.city ?? ""}</p>
                  </div>
                  {b.verificationStatus === "VERIFIED" ? <VerifiedBadge /> : null}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-gray-500">{b.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  {b._count.adverts > 0 ? `🎯 ${b._count.adverts} adverts` : null}
                  {b._count.specials > 0 ? `· ⚡ ${b._count.specials} specials` : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PubShell>
  );
}