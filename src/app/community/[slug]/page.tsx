import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircleHeart, MapPin, Users, Store, PackageOpen, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PubShell } from "@/components/layout/pub-shell";
import { AdCard, toAdCardData } from "@/components/ads/ad-card";
import { getCommunityBySlug } from "@/lib/communities/service";
import { listAdverts, expireAdverts } from "@/lib/ads/service";
import { listBusinesses } from "@/lib/businesses/service";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const community = await getCommunityBySlug(params.slug);
  return {
    title: community?.name ?? "Community",
    description: community?.description?.slice(0, 160) ?? "A local community marketplace powered by LocalReach.",
  };
}

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const community = await getCommunityBySlug(params.slug);
  if (!community) notFound();
  await expireAdverts();
  const [latest, businesses] = await Promise.all([
    listAdverts({ communityId: community.id, page: 1, pageSize: 8 }),
    listBusinesses({ communityId: community.id }, 1, 4),
  ]);
  const count = community._count;
  const waCta = community.whatsappCtaEnabled ? community.whatsappInviteUrl : null;

  return (
    <PubShell>
      <main>
        <section className="bg-gradient-to-br from-brand-800 to-brand-700 px-4 py-10 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{community.name}</h1>
          {community.tagline ? <p className="mt-1 text-brand-100">{community.tagline}</p> : null}
          <p className="mt-1 text-sm text-brand-100/80">
            <MapPin className="mr-1 inline h-4 w-4" aria-hidden />
            {[community.suburb, community.city, community.province].filter(Boolean).join(", ")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <Link href="/dashboard/ads/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-brand-800 hover:bg-brand-50">
              <PackageOpen className="h-4 w-4" /> Advertise
            </Link>
            {waCta ? (
              <a href={waCta} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 font-semibold text-white hover:bg-[#1eb957]">
                <MessageCircleHeart className="h-4 w-4" /> Join the WhatsApp Community
              </a>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="container-page">
            <h2 className="text-xl font-semibold text-gray-900">Latest adverts</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latest.items.slice(0, 8).map((advert) => <AdCard key={advert.id} advert={toAdCardData(advert)} />)}
            </div>
            <Link href="/ads" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">Browse all adverts →</Link>
          </div>
        </section>

        <section className="section bg-gray-50">
          <div className="container-page grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <Users className="h-7 w-7 text-brand-600" aria-hidden />
              <p className="mt-2 text-2xl font-bold text-gray-900">{count.members}</p>
              <p className="text-sm text-gray-500">Community members</p>
              <p className="mt-3 text-lg font-bold">{count.adverts}</p>
              <p className="text-sm text-gray-500">Live adverts</p>
              <p className="mt-3 text-lg font-bold">{count.businesses}</p>
              <p className="text-sm text-gray-500">Local businesses</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900">Categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {community.categories.map((c) => (
                  <Link key={c.id} href={`/ads?category=${c.slug}`} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-brand-300">{c.name}</Link>
                ))}
              </div>
              <Link href={`/community/${community.slug}/rules`} className="mt-4 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
                <ShieldCheck className="h-4 w-4" /> Community rules
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900">{community.description}</h2>
              <div className="mt-3 flex flex-col gap-2">
                {businesses.items.slice(0, 4).map((b) => (
                  <Link key={b.id} href={`/businesses/${b.slug}`} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2 text-sm hover:bg-gray-50">
                    <Store className="h-4 w-4 text-brand-600" aria-hidden /> {b.businessName}
                  </Link>
                ))}
              </div>
              <Link href="/businesses" className="mt-3 inline-block text-sm text-brand-700 hover:underline">View business directory →</Link>
            </div>
          </div>
        </section>
      </main>
    </PubShell>
  );
}