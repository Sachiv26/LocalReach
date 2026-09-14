import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { formatPrice, timeAgo, telLink, waMeLink } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { startBoostCheckoutAction } from "@/lib/actions/payments";
import { BoostButton } from "@/components/dashboard/boost-button";

const STATUS_TONE: Record<string, "gray" | "green" | "amber" | "red" | "blue"> = {
  PUBLISHED: "green",
  APPROVED: "green",
  PENDING_REVIEW: "amber",
  DRAFT: "gray",
  REJECTED: "red",
  EXPIRED: "gray",
  SUSPENDED: "red",
  ARCHIVED: "gray",
};

export const metadata = { title: "My adverts", description: "Manage your adverts." };

export default async function MyAdsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string;
  const filter = searchParams.filter ?? "all";

  const where: Prisma.AdvertWhereInput = {
    advertiserId: userId,
    deletedAt: null,
    ...(filter === "active"
      ? { status: { in: ["PUBLISHED", "APPROVED"] } }
      : filter === "pending"
        ? { status: "PENDING_REVIEW" }
        : filter === "drafts"
          ? { status: "DRAFT" }
          : {}),
  };
  const adverts = await prisma.advert.findMany({
    where,
    include: { images: { take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My adverts</h1>
          <p className="mt-1 text-sm text-gray-500">{adverts.length} shown</p>
        </div>
        <Link href="/dashboard/ads/new" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white">
          + New advert
        </Link>
      </div>

      <div className="flex gap-2 text-xs">
        {[["all", "All"], ["active", "Live"], ["pending", "Pending"], ["drafts", "Drafts"]].map(([key, label]) => (
          <a key={key} href={`/dashboard/ads?filter=${key}`} className={`rounded-full px-3 py-1 ${filter === key ? "bg-brand-600 text-white" : "border border-gray-200 text-gray-600"}`}>
            {label}
          </a>
        ))}
      </div>

      {adverts.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No adverts yet" : "Nothing here yet"}
          description="Post your first free advert and reach your neighbourhood."
          action={<Link href="/dashboard/ads/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Post an advert</Link>}
        />
      ) : (
        <div className="space-y-3">
          {adverts.map((advert) => (
            <div key={advert.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/ads/${advert.slug}`} className="font-semibold text-gray-900 hover:text-brand-700">{advert.title}</Link>
                    <Badge tone={STATUS_TONE[advert.status] ?? "gray"}>{advert.status.replace("_", " ")}</Badge>
                    {advert.isFeatured ? <Badge tone="amber">⭐ Featured</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {advert.price === null ? (advert.priceType === "FREE" ? "Free" : "—") : formatPrice(typeof advert.price === "object" ? advert.price.toNumber() : advert.price)} · {timeAgo(advert.createdAt)}
                    {advert.moderationReasons.length > 0 ? ` · ⚠ ${advert.moderationReasons.slice(0, 2).join(". ")}` : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {advert.status === "PUBLISHED" || advert.status === "APPROVED" ? (
                    <button type="button" className="hidden" />
                  ) : null}
                  {advert.status === "DRAFT" || advert.status === "REJECTED" ? (
                    <Link href={`/dashboard/ads/${advert.id}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700">Edit</Link>
                  ) : null}
                  {advert.whatsappNumber ? (
                    <a href={waMeLink(advert.whatsappNumber, `Hi, I’m interested in: ${advert.title}`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs text-white">WhatsApp</a>
                  ) : null}
                  {advert.contactPhone ? <a href={telLink(advert.contactPhone)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs">Call</a> : null}
                  {(advert.status === "PUBLISHED" || advert.status === "APPROVED") && !advert.isFeatured ? (
                    <BoostButton advertId={advert.id} communityId={advert.communityId} />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}