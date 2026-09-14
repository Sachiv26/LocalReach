import Link from "next/link";
import { Megaphone, Search, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AdCard, toAdCardData } from "@/components/ads/ad-card";
import { HomeBottomSections } from "@/components/marketing/home-bottom";
import { listAdverts, expireAdverts } from "@/lib/ads/service";
import { listPublicCommunities } from "@/lib/communities/service";
import { listBusinesses } from "@/lib/businesses/service";
import { Badge } from "@/components/ui/primitives";

export const metadata = {
  title: "Your neighbourhood. Your marketplace.",
  description:
    "LocalReach connects local people and businesses through trusted community marketplaces. Buy, sell and discover local businesses in your community.",
};

async function getFeatured() {
  await expireAdverts();
  const [featured, latest, communities, businesses] = await Promise.all([
    listAdverts({ featured: true, page: 1, pageSize: 5 }),
    listAdverts({ page: 1, pageSize: 8 }),
    listPublicCommunities(),
    listBusinesses({ communityId: undefined, verifiedOnly: false }, 1, 3),
  ]);
  return { featured, latest, communities, businesses };
}

export default async function HomePage() {
  const { featured, latest, communities, businesses } = await getFeatured();
  const primaryCommunity =
    communities.find((c) => c.slug === "umgeni-park-durban-north") ??
    communities[0];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600">
          <div className="container-page py-16 sm:py-24">
            <Badge tone="green" className="mb-4">🇿🇦 South Africa · KwaZulu-Natal</Badge>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
              Buy, sell and discover local businesses in your community.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-brand-100">
              LocalReach connects local people and businesses through trusted
              community marketplaces.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard/ads/new" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-brand-800 shadow-lg hover:bg-brand-50">
                <Megaphone className="h-5 w-5" aria-hidden /> Post an Advert
              </Link>
              <Link href="/ads" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur hover:bg-white/20">
                <Search className="h-5 w-5" aria-hidden /> Browse Marketplace
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container-page">
            <h2 className="text-xl font-semibold text-gray-900">Choose your community</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((c) => (
                <Link key={c.id} href={`/community/${c.slug}`} className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-brand-300 hover:shadow">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-brand-700">{c.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {[c.suburb, c.city, c.province].filter(Boolean).join(" · ") || "South Africa"}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-600" aria-hidden />
                </Link>
              ))}
            </div>
            {primaryCommunity && primaryCommunity._count ? (
              <p className="mt-4 text-sm text-gray-600">
                {primaryCommunity._count.members} members ·
                {primaryCommunity._count.businesses} businesses ·
                {primaryCommunity._count.adverts} live adverts
              </p>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="container-page">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Featured adverts</h2>
                <p className="mt-1 text-sm text-gray-500">Boosted by local members &amp; businesses</p>
              </div>
              <Link href="/ads?featured=1" className="text-sm font-medium text-brand-700 hover:underline">View all →</Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.items.map((advert) => <AdCard key={advert.id} advert={toAdCardData(advert)} />)}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container-page">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Latest adverts</h2>
                <p className="mt-1 text-sm text-gray-500">Fresh from the neighbourhood</p>
              </div>
              <Link href="/ads" className="text-sm font-medium text-brand-700 hover:underline">Browse all →</Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latest.items.slice(0, 8).map((advert) => <AdCard key={advert.id} advert={toAdCardData(advert)} />)}
            </div>
          </div>
        </section>
      </main>
      <HomeBottomSections />
      <MobileNav />
      <SiteFooter />
    </>
  );
}