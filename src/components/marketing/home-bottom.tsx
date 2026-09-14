import Link from "next/link";
import { MessageCircleHeart, ShieldCheck, BadgeCheck, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/primitives";

export function HomeBottomSections() {
  return (
    <>
      <section className="section bg-gray-50">
        <div className="container-page">
          <h2 className="text-xl font-semibold text-gray-900">Browse by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ["For Sale", "for-sale"], ["Services", "services"],
              ["Property", "property"], ["Vehicles", "vehicles"],
              ["Jobs", "jobs"], ["Supermarkets", "supermarkets"],
              ["Restaurants", "restaurants"], ["Electronics", "electronics"],
            ].map(([name, slug]) => (
              <Link key={slug} href={`/ads?category=${slug}`} className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-semibold text-gray-800 hover:border-brand-300">
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">For advertisers</h3>
            <ol className="mt-4 space-y-3">
              {[
                ["Create", "Write your advert and add up to 2 photos — combine multiple products into one collage."],
                ["Submit", "Community rules are checked automatically: free quota and prohibited content."],
                ["Get approved", "A community admin reviews your advert."],
                ["Reach locals", "Your advert goes live. Admins can share a WhatsApp-ready version with the community."],
              ].map(([step, desc]) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">•</span>
                  <div>
                    <p className="font-semibold text-gray-900">{step}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">For buyers</h3>
            <ol className="mt-4 space-y-3">
              {[
                ["Browse", "Explore adverts and local businesses in your community."],
                ["Contact", "Chat with the seller on WhatsApp or call them directly."],
                ["Do your due diligence", "Always verify sellers and products yourself before paying."],
              ].map(([step, desc]) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">•</span>
                  <div>
                    <p className="font-semibold text-gray-900">{step}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      <section className="section bg-brand-950">
        <div className="container-page max-w-3xl text-center">
          <MessageCircleHeart className="mx-auto h-12 w-12 text-brand-300" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold text-white">Still using WhatsApp? Perfect.</h2>
          <p className="mt-3 text-lg text-brand-100">
            LocalReach works alongside your existing WhatsApp community. You can
            continue discovering and sharing local adverts through WhatsApp while
            using LocalReach to manage listings, businesses and promotions.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/community/umgeni-park-durban-north" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-800">
              Explore the Umgeni Park community
            </Link>
            <Link href="/admin/partnership" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/30 px-5 text-sm font-semibold text-white hover:bg-white/10">
              For WhatsApp admins
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <Card className="border-amber-200 bg-amber-50 p-6">
            <ShieldCheck className="h-8 w-8 text-amber-600" aria-hidden />
            <h3 className="mt-2 font-semibold text-gray-900">Buyer beware</h3>
            <p className="mt-2 text-sm text-gray-700">
              LocalReach is a marketplace platform and does not guarantee sellers,
              buyers, products or transactions. Always perform your own due
              diligence before paying.
            </p>
          </Card>
          <Card className="border-amber-200 bg-amber-50 p-6">
            <BadgeCheck className="h-8 w-8 text-amber-600" aria-hidden />
            <h3 className="mt-2 font-semibold text-gray-900">Honest verification</h3>
            <p className="mt-2 text-sm text-gray-700">
              “Verified” means <em>business details verified by LocalReach</em> —
              it is not a guarantee of trustworthiness.
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}