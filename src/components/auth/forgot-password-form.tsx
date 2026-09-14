"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void setBusy(true);
        void forgotPasswordAction({ email: String(fd.get("email") ?? "") }).then((res) => {
          setBusy(false);
          if (res.ok) setStatus("sent");
          else {
            setStatus("error");
            setError(res.message);
          }
        });
      }}
    >
      {status === "sent" ? (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : null}
      {status === "error" && error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}
      <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email"
        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none" />
      <button disabled={busy}
        className="h-12 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}