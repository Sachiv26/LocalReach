import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Globe, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import { PubShell } from "@/components/layout/pub-shell";
import { AdCard, toAdCardData } from "@/components/ads/ad-card";
import { VerifiedBadge } from "@/components/ads/ad-card";
import { Alert } from "@/components/ui/primitives";
import { getBusinessBySlug } from "@/lib/businesses/service";
import { telLink } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const business = await getBusinessBySlug(params.slug);
  if (!business) return { title: "Business not found" };
  return {
    title: business.businessName,
    description: business.description.slice(0, 160),
    alternates: { canonical: `/businesses/${business.slug}` },
  };
}

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const business = await getBusinessBySlug(params.slug);
  if (!business) notFound();
  const tradingHours = Array.isArray(business.tradingHours) ? business.tradingHours : null;

  return (
    <PubShell>
      <main className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <aside className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-3xl">🏪</div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{business.businessName}</h1>
                  <p className="text-xs text-gray-500">{business.suburb ?? ""} {business.city ?? ""}</p>
                  {business.verificationStatus === "VERIFIED" ? <VerifiedBadge /> : null}
                </div>
              </div>
              {business.socialLinks && typeof business.socialLinks === "object" ? (
                <p className="mt-2 text-xs text-gray-500">
                  {Object.entries(business.socialLinks as Record<string, string>)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                {business.phone ? (
                  <a href={telLink(business.phone)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium hover:bg-gray-50">
                    <Phone className="h-4 w-4" /> {business.phone}
                  </a>
                ) : null}
                {business.whatsapp ? (
                  <a href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-medium text-white hover:bg-[#1eb957]">
                    <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                  </a>
                ) : null}
                {business.website ? (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium hover:bg-gray-50">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                ) : null}
              </div>
            </div>
            {business.verificationStatus === "VERIFIED" ? (
              <Alert tone="blue">
                Business details verified by LocalReach — this is not a guarantee of trustworthiness.
              </Alert>
            ) : null}
            {/* PART2 */}
            {tradingHours ? (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900"><Clock3 className="mr-1 inline h-4 w-4" /> Trading hours</p>
                <table className="mt-2 w-full text-xs text-gray-600">
                  <tbody>
                    {(tradingHours as { day: string; open?: string; close?: string; closed?: boolean }[]).map((h) => (
                      <tr key={h.day}>
                        <td className="py-1">{h.day}</td>
                        <td className="py-1 text-right font-medium">{h.closed ? "Closed" : `${h.open} – ${h.close}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </aside>

          <div className="space-y-8">
            <p className="whitespace-pre-line text-gray-700">{business.description}</p>

            {business.specials.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">Current specials ⚡</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {business.specials.map((s) => (
                    <div key={s.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-gray-900">{s.title}</p>
                      {s.priceNote ? <p className="font-bold text-brand-700">{s.priceNote}</p> : null}
                      <p className="mt-1 text-xs text-gray-600">{s.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {/* PART3 */}
            {business.adverts.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">Active adverts</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {business.adverts.map((advert) => <AdCard key={advert.id} advert={toAdCardData(advert)} />)}
                </div>
              </section>
            ) : null}

            {business.reviews.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-gray-900">What locals say</h2>
                <div className="mt-3 space-y-3">
                  {business.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-gray-200 p-3">
                      <p className="text-sm font-semibold">{r.authorName} <span className="text-amber-500">{"★".repeat(r.rating)}</span></p>
                      <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </PubShell>
  );
}