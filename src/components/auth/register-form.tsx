"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void setBusy(true);
        void registerAction({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          password: String(fd.get("password") ?? ""),
          marketingOptIn: fd.get("marketing") === "on",
        }).then((res) => {
          if (!res.ok) {
            setBusy(false);
            setError(res.message);
            return;
          }
          void signIn("credentials", {
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? ""),
            redirect: false,
          }).then((sRes) => {
            setBusy(false);
            if (sRes?.error) {
              router.push("/login?registered=1");
            } else {
              router.push("/dashboard");
              router.refresh();
            }
          });
        });
      }}
    >
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}
      <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
      <input id="name" name="name" required autoComplete="name"
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
      <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email"
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
      <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
      <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
      <p className="text-xs text-gray-500">At least 8 characters.</p>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input name="marketing" type="checkbox" className="h-4 w-4 accent-brand-600" />
        I’d like to hear about local marketplace news (optional, no spam)
      </label>
      <button disabled={busy}
        className="h-12 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? "Creating account…" : "Create free account"}
      </button>
      <p className="text-center text-sm text-gray-500">
        Already registered? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
      </p>
      <p className="text-center text-xs text-gray-400">
        By creating an account you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}