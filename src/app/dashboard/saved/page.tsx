import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/access";
import prisma from "@/lib/db";

export const metadata = { title: "Saved adverts · LocalReach" };

export default async function SavedAdsPage() {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  const saved = await prisma.savedAdvert.findMany({
    where: { userId: ctx.userId, advert: { deletedAt: null, status: "PUBLISHED" } },
    include: {
      advert: {
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          community: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">Saved adverts</h1>
      <p className="mt-1 text-sm text-gray-500">Adverts you bookmarked.</p>
      <div className="mt-6 space-y-3">
        {saved.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No saved adverts yet.
          </div>
        ) : (
          saved.map((s) => (
            <div key={s.advertId} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
              {s.advert.images[0] && (
                <img src={s.advert.images[0].url} alt={s.advert.title} className="h-16 w-20 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{s.advert.title}</p>
                <p className="text-xs text-gray-500">{s.advert.community.slug}</p>
              </div>
              <a href={"/ads/" + s.advert.slug} className="text-sm font-medium text-brand-700 hover:underline">
                View
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
