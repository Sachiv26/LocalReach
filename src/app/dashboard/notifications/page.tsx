import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/access";
import { listNotifications, markNotificationsRead } from "@/lib/notifications/service";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Notifications · LocalReach" };

export default async function NotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  const { items, total, unread } = await listNotifications(ctx.userId);
  if (unread > 0) await markNotificationsRead(ctx.userId);
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      <p className="mt-1 text-sm text-gray-500">
        {total} total &middot; {unread} unread
      </p>
      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            You are all caught up.
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={
                "flex gap-3 rounded-xl border bg-white p-4 " +
                (n.readAt ? "border-gray-200" : "border-brand-200 bg-brand-50/40")
              }
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
