import { redirect } from "next/navigation";
import { tryRequireAdminArea } from "@/lib/auth/access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";

export default async function AdminSettingsPage() {
  const area = await tryRequireAdminArea("MANAGE_COMMUNITY");
  if (!area) redirect("/403");
  const { communities } = area;
  const community = communities[0];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <Card><CardHeader><CardTitle className="text-base font-semibold text-gray-900">Community</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-500">{community?.name ?? "No community"}</p></CardContent></Card>
    </div>
  );
}
