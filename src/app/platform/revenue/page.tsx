import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformRevenuePage() {
  const [totalPaid, byProvider] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.groupBy({ by: ["provider"], where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Total paid</p>
        <p className="text-3xl font-bold text-gray-900">R{Number(totalPaid._sum.amount ?? 0).toLocaleString("en-ZA")}</p>
      </div>
      <div className="space-y-2">
        {byProvider.map((b) => (
          <div key={b.provider} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">{b.provider}</p>
            <p className="font-semibold text-gray-900">R{Number(b._sum.amount ?? 0).toLocaleString("en-ZA")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
