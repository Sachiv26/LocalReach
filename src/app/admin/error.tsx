"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the digest so it can be traced in structured logs.
    console.error("Admin page error:", error.digest ?? error.message);
  }, [error]);

  const isForbidden =
    error.message?.includes("do not have permission") ||
    error.message?.includes("not an admin") ||
    error.message?.includes("not an administrator");

  return (
    <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      {isForbidden ? (
        <>
          <p className="text-5xl">🔒</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">No access</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your moderator role does not include permission to view this section. Ask a
            community owner or admin if you think this is a mistake.
          </p>
          <Link
            href="/admin"
            className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Back to admin overview
          </Link>
        </>
      ) : (
        <>
          <p className="text-5xl">😕</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t load this page. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}