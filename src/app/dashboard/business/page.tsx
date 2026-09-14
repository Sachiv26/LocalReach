import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/access";
import prisma from "@/lib/db";

export const metadata = { title: "My business · LocalReach" };

export default async function MyBusinessPage() {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  const business = await prisma.businessProfile.findFirst({
    where: { ownerId: ctx.userId, deletedAt: null },
    include: { community: { select: { name: true, slug: true } } },
  });
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">My business</h1>
      <p className="mt-1 text-sm text-gray-500">
        {business ? "Manage your business profile." : "Register your business to reach more local customers."}
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Business form coming soon. For now, use /dashboard/ads/new to post adverts.</p>
      </div>
    </div>
  );
}
