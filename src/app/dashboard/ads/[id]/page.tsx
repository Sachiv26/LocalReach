import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/access";
import prisma from "@/lib/db";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Edit advert · LocalReach" };

export default async function EditAdvertPage({ params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx.userId) return null;
  const advert = await prisma.advert.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { sortOrder: "asc" } }, community: true, category: true },
  });
  if (!advert || advert.advertiserId !== ctx.userId) notFound();
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">{advert.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Status: {advert.status} &middot; Updated {timeAgo(advert.updatedAt)}
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Edit form placeholder.</p>
      </div>
    </div>
  );
}
