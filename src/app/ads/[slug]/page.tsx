import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Globe, MapPin, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import { PubShell } from "@/components/layout/pub-shell";
import { AdCard, toAdCardData } from "@/components/ads/ad-card";
import { Gallery, AdvertActions } from "@/components/ads/interact";
import { Badge, Alert } from "@/components/ui/primitives";
import { getAdvertBySlug, getRelatedAdverts, recordInteraction } from "@/lib/ads/service";
import { formatPrice, formatDate, telLink, waMeLink } from "@/lib/utils";
import prisma from "@/lib/db";
import { getAuthContext } from "@/lib/auth/access";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const advert = await getAdvertBySlug(params.slug);
  if (!advert || advert.deletedAt) return { title: "Advert not found" };
  if (advert.status !== "PUBLISHED") {
    // Not publicly live yet — keep it out of search engines.
    return { title: `${advert.title} · LocalReach`, robots: { index: false, follow: false } };
  }
  return {
    title: advert.title,
    description: advert.description.slice(0, 160),
    alternates: { canonical: `/ads/${advert.slug}` },
    openGraph: {
      title: advert.title,
      description: advert.description.slice(0, 160),
      images: advert.images[0]?.url ? [advert.images[0].url] : [],
    },
  };
}

/**
 * Status banners shown to the advert owner or community moderators when they
 * open an advert that is not publicly live. The public still gets a 404 —
 * only the owner and moderators can preview pending/rejected/expired adverts.
 */
const STATUS_BANNER: Record<
  string,
  { tone: "amber" | "red" | "blue"; title: string; body: string }
> = {
  DRAFT: {
    tone: "blue",
    title: "Draft — not submitted yet",
    body: "This advert is still a draft. Submit it for review to make it visible to the community.",
  },
  PENDING_REVIEW: {
    tone: "amber",
    title: "Awaiting moderation",
    body: "This advert has been submitted and is waiting for a community moderator to approve it. It is not visible to the public yet.",
  },
  APPROVED: {
    tone: "blue",
    title: "Approved — publishing",
    body: "This advert has been approved and will be visible to the public shortly.",
  },
  REJECTED: {
    tone: "red",
    title: "Rejected by moderation",
    body: "This advert was rejected during moderation and is not visible to the public. The moderator's reason is available in your dashboard.",
  },
  EXPIRED: {
    tone: "blue",
    title: "Expired",
    body: "This advert has expired and is no longer visible to the public.",
  },
  SUSPENDED: {
    tone: "red",
    title: "Suspended",
    body: "This advert was suspended by moderators and is not visible to the public.",
  },
  ARCHIVED: {
    tone: "blue",
    title: "Archived",
    body: "This advert has been archived and is not visible to the public.",
  },
};

export default async function AdvertDetailPage({ params }: { params: { slug: string } }) {
  const advert = await getAdvertBySlug(params.slug);
  if (!advert || advert.deletedAt) notFound();

  const ctx = await getAuthContext();
  const isOwner = Boolean(ctx.userId && ctx.userId === advert.advertiser.id);
  const isAdmin =
    ctx.isSuperAdmin ||
    ctx.adminMemberships.some((m) => m.communityId === advert.communityId);
  const canPreview = isOwner || isAdmin;

  // Public visitors only ever see published adverts; owners and moderators get
  // a preview with a status banner instead of a confusing 404.
  if (advert.status !== "PUBLISHED" && !canPreview) notFound();
  if (advert.status === "PUBLISHED") void recordInteraction(advert.id, "VIEW");

  const banner = STATUS_BANNER[advert.status];
  const saved = ctx.userId
    ? Boolean(
        await prisma.savedAdvert.findUnique({
          where: { userId_advertId: { userId: ctx.userId as string, advertId: advert.id } },
        })
      )
    : false;
  const related = await getRelatedAdverts(advert.id, advert.categoryId, advert.communityId);
  const price = advert.price === null ? null : formatPrice(typeof advert.price === "object" ? advert.price.toNumber() : advert.price);
  const location = [advert.suburb, advert.city, advert.province].filter(Boolean).join(", ");
  const sellerWaNumber = advert.whatsappNumber ?? advert.contactPhone;

  return (
    <PubShell>
      <main className="container-page py-8">
        <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/ads" className="hover:underline">All adverts</Link>{" / "}
          <Link href={`/ads?category=${advert.category.slug}`} className="hover:underline">{advert.category.name}</Link>
        </nav>
        {banner ? (
          <div className="mt-4">
            <Alert tone={banner.tone} title={banner.title}>
              {banner.body}{" "}
              {isOwner ? (
                <Link href="/dashboard/ads" className="font-semibold underline">Manage your adverts</Link>
              ) : (
                <Link href="/admin/ads/pending" className="font-semibold underline">Open moderation queue</Link>
              )}
            </Alert>
          </div>
        ) : null}
        <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <Gallery images={advert.images} title={advert.title} />
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-2 whitespace-pre-line text-gray-700">{advert.description}</p>
            </div>
            {advert.business ? (
              <div className="mt-6 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Listed by</p>
                <Link href={`/businesses/${advert.business.slug}`} className="font-semibold text-brand-700 hover:underline">
                  {advert.business.businessName}
                </Link>
              </div>
            ) : null}
            {related.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">Related adverts</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((ad) => <AdCard key={ad.id} advert={toAdCardData(ad)} />)}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{advert.title}</h1>
              <p className="mt-2 text-2xl font-bold text-brand-700">
                {price ??
                  (advert.priceType === "FREE" ? "Free" : advert.priceType === "CONTACT_SELLER" ? "Contact seller" : "—")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {location}</span> : null}
                <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {formatDate(advert.createdAt)}</span>
                {advert.expiresAt ? <span className="text-gray-400">· Expires {formatDate(advert.expiresAt)}</span> : null}
              </div>
              {advert.isFeatured ? <Badge tone="amber" className="mt-2">⭐ Featured</Badge> : null}
            </div>
            <AdvertActions advertId={advert.id} title={advert.title} slug={advert.slug} initialSaved={saved} />
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold text-gray-900">{advert.contactName}</p>
              <div className="mt-3 flex flex-col gap-2">
                {sellerWaNumber ? (
                  <a
                    href={waMeLink(sellerWaNumber, `Hi, I’m interested in your LocalReach advert: ${advert.title}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1eb957]"
                  >
                    <MessageCircle className="h-5 w-5" /> WhatsApp seller
                  </a>
                ) : null}
                {advert.contactPhone ? (
                  <a href={telLink(advert.contactPhone)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                    <Phone className="h-5 w-5" /> Call {advert.contactPhone}
                  </a>
                ) : null}
                {advert.externalWebsite ? (
                  <a href={advert.externalWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                    <Globe className="h-5 w-5" /> Visit website
                  </a>
                ) : null}
              </div>
            </div>

            <Alert tone="amber" title="Buyer beware">
              LocalReach does not guarantee transactions. Perform your own due diligence before paying.
            </Alert>
            <Alert tone="blue">
              Listed by {advert.advertiser.name ?? "a community member"} · <Link href="/safety" className="underline">Safety tips</Link>
            </Alert>
            {/* PART2 */}
          </aside>
        </div>
      </main>
    </PubShell>
  );
}