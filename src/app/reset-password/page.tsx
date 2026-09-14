"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const router = useRouter();
  const token = searchParams.token ?? "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or incomplete.">
        <Link href="/forgot-password" className="block h-12 w-full rounded-xl bg-brand-600 pt-3 text-center text-sm font-semibold text-white">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something secure and memorable.">
      {done ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
          Password updated! <Link href="/login" className="font-semibold underline">Sign in now</Link>.
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void setBusy(true);
            void resetPasswordAction({
              token,
              password: String(fd.get("password") ?? ""),
            }).then((res) => {
              setBusy(false);
              if (res.ok) {
                setDone(true);
                void router.push("/login?reset=1");
              } else setError(res.message);
            });
          }}
        >
          {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
          <button disabled={busy} className="h-12 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}