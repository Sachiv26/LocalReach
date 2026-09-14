import { PubShell } from "@/components/layout/pub-shell";
import { AdCard, toAdCardData } from "@/components/ads/ad-card";
import { SortSelect } from "./filter-bar";
import { listAdverts, expireAdverts } from "@/lib/ads/service";
import prisma from "@/lib/db";

export const metadata = {
  title: "Browse Local Ads",
  description: "Browse adverts from your neighbourhood — jobs, property, vehicles, services and local businesses.",
};

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  await expireAdverts();
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const q = searchParams.q ?? "";
  const featured = searchParams.featured === "1";
  const sort = ["price_asc", "price_desc"].includes(searchParams.sort ?? "")
    ? (searchParams.sort as string)
    : "newest";
  const category = searchParams.category
    ? await prisma.category.findFirst({ where: { slug: searchParams.category } })
    : null;
  const result = await listAdverts({
    q: q || undefined,
    categoryIds: category ? [category.id] : undefined,
    featured: featured || undefined,
    sort: (searchParams.sort as "newest" | "oldest" | "price_asc" | "price_desc" | "featured") ?? "newest",
    page,
  });
  const communities = await prisma.community.findMany({
    where: { deletedAt: null, status: { in: ["ACTIVE", "PILOT"] } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PubShell>
      <main className="container-page py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Local Ads</h1>
            <p className="mt-1 text-sm text-gray-500">{result.total} live advert{result.total === 1 ? "" : "s"}</p>
          </div>
          <form action="/ads" method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search adverts, suburbs…"
              aria-label="Search adverts"
              className="h-10 w-56 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:border-brand-500"
            />
            <button className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Search</button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Communities:</span>
          {communities.map((c) => (
            <a key={c.slug} href={`/community/${c.slug}`} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-brand-300">
              {c.name}
            </a>
          ))}
          <a href={featured ? "/ads" : "/ads?featured=1"} className={`rounded-full px-3 py-1 text-xs ${featured ? "bg-brand-600 text-white" : "border border-gray-200 text-gray-600"}`}>
            ⭐ Featured only
          </a>
          <div className="flex items-center gap-1">
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <SortSelect
              value={(searchParams.sort as "newest" | "oldest" | "price_asc" | "price_desc") ?? "newest"}
              preserved={q ? [{ key: "q", value: q }] : []}
            />
          </div>
        </div>

        {result.items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-base font-semibold text-gray-900">No adverts found</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search, or be the first to post an advert.</p>
            <a href="/dashboard/ads/new" className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Post an Advert</a>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((advert) => <AdCard key={advert.id} advert={toAdCardData(advert)} />)}
          </div>
        )}

        {result.totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
            {page > 1 ? (
              <a href={`/ads?page=${page - 1}&q=${encodeURIComponent(q)}&sort=${sort}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700">← Prev</a>
            ) : null}
            <span className="text-sm text-gray-500">Page {page} of {result.totalPages}</span>
            {page < result.totalPages ? (
              <a href={`/ads?page=${page + 1}&q=${encodeURIComponent(q)}&sort=${sort}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700">Next →</a>
            ) : null}
          </nav>
        ) : null}
      </main>
    </PubShell>
  );
}