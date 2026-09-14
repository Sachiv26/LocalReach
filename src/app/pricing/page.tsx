import { PubShell } from "@/components/layout/pub-shell";
import prisma from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { BadgeCheck, Megaphone, Star, Store, Tag } from "lucide-react";

export const metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for adverts and businesses. All prices are set by each community.",
};

const PLAN_ICONS: Record<string, typeof Tag> = {
  FREE: Tag,
  BOOST: Star,
  PREMIUM: Megaphone,
  BUSINESS_MONTHLY: Store,
  BUSINESS_ANNUAL: Store,
  VERIFIED_BUSINESS: BadgeCheck,
};

export default async function PricingPage() {
  const community = await prisma.community.findUnique({
    where: { slug: "umgeni-park-durban-north" },
  });
  const plans = await prisma.pricingPlan.findMany({
    where: { communityId: community?.id, isActive: true },
    orderBy: { planKey: "asc" },
  });
  const ordered = ["FREE", "BOOST", "PREMIUM", "BUSINESS_MONTHLY", "VERIFIED_BUSINESS", "BUSINESS_ANNUAL"];

  return (
    <PubShell>
      <main className="container-page py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-gray-900">Simple, local pricing</h1>
          <p className="mt-2 text-gray-600">
            Free advertising stays free. Boosts and business subscriptions are
            optional extras — and every price is set by your community admin,
            never hard-coded.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((key) => {
            const plan = plans.find((p) => p.planKey === key);
            if (!plan) return null;
            const Icon = PLAN_ICONS[key] ?? Tag;
            return (
              <div key={key} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {formatPrice(Number(plan.price), plan.currency)}
                  <span className="text-sm text-gray-500">
                    {plan.billingPeriod === "ONE_TIME"
                      ? ""
                      : plan.billingPeriod === "MONTHLY"
                        ? "/month"
                        : "/year"}
                  </span>
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-600">
                      <span className="text-brand-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Demo prices for the pilot community (FREE R0 · BOOST R39 · PREMIUM R79 ·
          BUSINESS R299/month · VERIFIED R199/year). Community admins can change
          these at any time from the pricing admin screen.
        </p>
      </main>
    </PubShell>
  );
}