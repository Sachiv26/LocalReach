import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/access";
import prisma from "@/lib/db";
import { formatCurrency, timeAgo } from "@/lib/utils";

export const metadata = { title: "Payments & boosts · LocalReach" };

export default async function PaymentsPage() {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  const payments = await prisma.payment.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">Payments & boosts</h1>
      <p className="mt-1 text-sm text-gray-500">Your payment history and active boosts.</p>
      <div className="mt-6 space-y-2">
        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No payments yet.
          </div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <p className="font-medium text-gray-900">{("Payment").replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500">{timeAgo(p.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(Number(p.amount), p.currency)}</p>
                <span
                  className={
                    "text-xs font-medium " +
                    (p.status === "PAID" ? "text-green-600" : p.status === "FAILED" ? "text-red-600" : "text-amber-600")
                  }
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
