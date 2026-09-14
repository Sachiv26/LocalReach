import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformOverviewPage() {
  const [communities, users, adverts, payments] = await Promise.all([
    prisma.community.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.advert.count({ where: { deletedAt: null } }),
    prisma.payment.count(),
  ]);
  const paid = await prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } });

  const cards = [
    { label: "Communities", value: communities },
    { label: "Users", value: users },
    { label: "Adverts", value: adverts },
    { label: "Total revenue", value: `R${Number(paid._sum.amount ?? 0).toLocaleString("en-ZA")}` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
