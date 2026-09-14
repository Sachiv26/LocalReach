import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import prisma from "@/lib/db";

export default async function AdminCategoriesPage() {
  const area = await tryRequireAdminArea("MANAGE_CATEGORIES");
  if (!area) redirect("/403");
  const { communityId } = area;
  const categories = communityId ? await prisma.category.findMany({ where: { communityId }, orderBy: { sortOrder: "asc" } }) : [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      <div className="space-y-2">
        {categories.length === 0 ? <p className="text-sm text-gray-500">No categories.</p> : categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">{c.name}</p>
            <span className="text-xs font-medium text-gray-600">{c.isActive ? "Active" : "Inactive"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
