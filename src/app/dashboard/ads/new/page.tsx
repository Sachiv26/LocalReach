import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { AdvertForm } from "@/components/ads/advert-form";
import { Alert } from "@/components/ui/primitives";

export const metadata = { title: "Post an advert", description: "Post a free advert in your community." };

export default async function NewAdvertPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string;
  const communities = await prisma.community.findMany({
    where: { deletedAt: null, status: { in: ["ACTIVE", "PILOT"] } },
    orderBy: { name: "asc" },
  });
  const defaultCommunity = communities.find((c) => c.slug === "umgeni-park-durban-north") ?? communities[0];
  const categories = defaultCommunity
    ? await prisma.category.findMany({
        where: { communityId: defaultCommunity.id, isActive: true, isProhibited: false },
        orderBy: { sortOrder: "asc" },
      })
    : [];
  const postsThisMonth = defaultCommunity
    ? await prisma.advert.count({
        where: {
          advertiserId: userId,
          communityId: defaultCommunity.id,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      })
    : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Post an advert</h1>
      {!defaultCommunity ? (
        <Alert tone="amber" title="No community available">
          No communities are live yet. Check back soon.
        </Alert>
      ) : (
        <>
          <Alert tone="blue">
            <strong>Good to know:</strong> free adverts are limited per week and multiple
            products must be combined into one collage. Your advert is automatically
            checked against the community rules — you can submit at any time.
          </Alert>
          <AdvertForm
            communities={communities.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              maxImages: c.maxAdImages,
              allowCollage: c.allowCollage,
              quietHours:
                c.postingStartHour === c.postingEndHour
                  ? null
                  : `${c.postingEndHour}:00 – ${c.postingStartHour}:00`,
            }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
          />
        </>
      )}
    </div>
  );
}