"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/" })}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 ${className ?? ""}`}
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
    </button>
  );
}
