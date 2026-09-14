import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/access";
import prisma from "@/lib/db";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export const metadata = { title: "Account settings · LocalReach" };

export default async function SettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx.userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-gray-900">{user?.name ?? ""}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-gray-900">{user?.email ?? ""}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Roles</label>
          <p className="mt-1 text-gray-900">{ctx.roles.join(", ") || "USER"}</p>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Sign out</h2>
        <p className="mt-1 text-sm text-red-700">End your session on this device. You&apos;ll need to sign in again to access your account.</p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
