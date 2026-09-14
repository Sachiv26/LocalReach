import Link from "next/link";

export const metadata = { title: "403 · No access · LocalReach" };

export default function ForbiddenPage() {
  return (
    <div className="container-page flex min-h-[70vh] max-w-md flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl">🚫</p>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">You don&apos;t have access</h1>
      <p className="mt-3 text-sm text-gray-600">
        This area is restricted. If you believe you should have access, please ask a
        community administrator or the platform team.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to LocalReach
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Go to my dashboard →
        </Link>
      </div>
    </div>
  );
}