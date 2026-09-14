import Link from "next/link";
import prisma from "@/lib/db";
import { requireAdminArea } from "@/lib/auth/access";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { AppError } from "@/lib/errors";

export const metadata = { title: "Moderate advert · Admin" };

export default async function AdminAdDetailPage({ params }: { params: { id: string } }) {
  const { communityId } = await requireAdminArea("MODERATE_ADS");
  const advert = await prisma.advert.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      advertiser: { select: { id: true, name: true, email: true } },
      category: { select: { name: true } },
      moderationActions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: { select: { name: true, email: true } } },
      },
    },
  });
  if (!advert || advert.communityId !== communityId || advert.deletedAt) {
    throw new AppError("NOT_FOUND", "This advert could not be found in your community.");
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/ads/pending" className="text-sm text-brand-700 hover:underline">← Back to pending review</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{advert.title}</h1>
          <p className="text-sm text-gray-600">
            {advert.category?.name ?? "Uncategorised"} · price{" "}
            {advert.price ? `R${Number(advert.price).toLocaleString("en-ZA")}` : "not set"} ·{" "}
            {advert.status} · risk {advert.riskScore ?? "—"}/100
            {advert.moderationReasons.length ? ` · ${advert.moderationReasons.join(", ")}` : ""}
          </p>

          {advert.images.length ? (
            <div className="flex flex-wrap gap-2">
              {advert.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt ?? advert.title}
                  className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No images uploaded.
            </p>
          )}

          <pre className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
            {advert.description}
          </pre>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">Seller</h2>
            <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-gray-500">Name</dt><dd>{advert.contactName}</dd></div>
              <div><dt className="text-xs text-gray-500">Account</dt><dd>{advert.advertiser?.name ?? advert.advertiser?.email ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-500">Phone</dt><dd>{advert.contactPhone ?? "—"}</dd></div>
              <div><dt className="text-xs text-gray-500">WhatsApp</dt><dd>{advert.whatsappNumber ?? "—"}</dd></div>
              {advert.suburb ? <div><dt className="text-xs text-gray-500">Area</dt><dd>{[advert.suburb, advert.city, advert.province].filter(Boolean).join(", ")}</dd></div> : null}
            </dl>
          </section>

          {advert.moderationActions.length ? (
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-base font-semibold text-gray-900">Moderation history</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {advert.moderationActions.map((m) => (
                  <li key={m.id} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-500" />
                    <div>
                      <p className="text-gray-800">{m.action.replace(/_/g, " ").toLowerCase()}</p>
                      <p className="text-xs text-gray-500">
                        {m.actor?.name ?? m.actor?.email ?? "System"} · {m.createdAt.toLocaleString("en-ZA")}
                        {m.reason ? ` · ${m.reason}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          {advert.status !== "APPROVED" && advert.status !== "PUBLISHED" ? (
            <ModerationActions communityId={communityId} advertId={advert.id} />
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              This advert is currently {advert.status.toLowerCase()} — no action required.
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
            Automated moderation is advisory. A human decision is always recorded in the audit trail.
          </div>
        </div>
      </div>
    </div>
  );
}
