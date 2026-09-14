import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformPaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <p className="font-medium text-gray-900">R{Number(p.amount).toLocaleString("en-ZA")} · {p.provider}</p>
              <p className="text-xs text-gray-500">{p.user?.email} · {p.createdAt.toLocaleDateString("en-ZA")}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "PAID" ? "bg-green-100 text-green-700" : p.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
