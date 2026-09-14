import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PubShell } from "@/components/layout/pub-shell";
import prisma from "@/lib/db";

export const metadata = {
  title: "Community Rules",
  description: "The rules every advert must follow in this community.",
};

export default async function CommunityRulesPage({ params }: { params: { slug: string } }) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: { rules: { orderBy: { severity: "asc" } } },
  });
  if (!community) notFound();

  return (
    <PubShell>
      <main className="container-page max-w-3xl py-10">
        <h1 className="text-2xl font-bold text-gray-900">{community.name} — Community Rules</h1>
        <p className="mt-2 text-sm text-gray-500">
          These rules keep our community safe and adverts relevant. LocalReach
          checks them automatically and community admins can override any
          automated decision.
        </p>
        <div className="mt-6 space-y-3">
          {community.rules.map((rule) => (
            <div key={rule.id} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <ShieldCheck className={`h-5 w-5 shrink-0 ${rule.enabled ? "text-brand-600" : "text-gray-300"}`} aria-hidden />
              <div>
                <p className="font-semibold text-gray-900">
                  {rule.name}
                  {rule.enabled ? null : <span className="ml-2 text-xs text-gray-400">(disabled)</span>}
                </p>
                {rule.description ? <p className="mt-1 text-sm text-gray-500">{rule.description}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </main>
    </PubShell>
  );
}