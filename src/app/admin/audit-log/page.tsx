import { redirect } from "next/navigation";
import { listAuditLogs } from "@/lib/audit/service";
import { tryRequireAdminArea } from "@/lib/auth/access";
import { Pagination } from "@/components/ui/primitives";

export const metadata = { title: "Audit Log · Admin" };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const area = await tryRequireAdminArea("MANAGE_COMMUNITY");
  if (!area) redirect("/403");
  const { communityId } = area;

  const { items, total, pageSize } = await listAuditLogs(
    communityId ? { communityId } : {},
    page,
    20
  );
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Record of sensitive admin actions. Changes to rules, pricing, moderation decisions and user management are tracked here.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">When</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">No audit entries yet.</td></tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{log.createdAt.toLocaleString("en-ZA")}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.actor?.name ?? log.actor?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} hrefPrefix="/admin/audit-log" />
    </div>
  );
}
