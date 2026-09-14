"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/ads/validation";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  useEffect(() => {
    if (callbackUrl.startsWith("/api/auth/error")) {
      setError("Authentication failed. Please check your details and try again.");
    }
  }, [callbackUrl]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") ?? "");
        const password = String(fd.get("password") ?? "");
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Please check your details.");
          return;
        }
        void setBusy(true);
        void signIn("credentials", {
          email: parsed.data.email,
          password: parsed.data.password,
          redirect: true,
          callbackUrl: callbackUrl && !callbackUrl.includes("/api/auth/") ? callbackUrl : "/dashboard",
        }).then((res) => {
          setBusy(false);
          if (res?.error) {
            setError("Incorrect email or password.");
          }
        });
      }}
    >
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}
      <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email"
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
      <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
      <input id="password" name="password" type="password" required autoComplete="current-password"
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
      <button disabled={busy}
        className="h-12 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-gray-500">
        <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">Forgot your password?</Link>
      </p>
      <div className="my-3 text-center text-xs text-gray-400">or</div>
      <button type="button" onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
        disabled={!googleEnabled}
        className="h-12 w-full rounded-xl border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
        Continue with Google{googleEnabled ? "" : " (not configured)"}
      </button>
      <p className="text-center text-sm text-gray-500">
        New to LocalReach? <Link href="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
      </p>
    </form>
  );
}