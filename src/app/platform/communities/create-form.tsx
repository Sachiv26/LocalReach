"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreateCommunityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, adminEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create community.");
      }
      setName("");
      setAdminEmail("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ Create community</Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Community name</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Umgeni Park & Durban North" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
      </div>
      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Admin email</label>
        <input id="adminEmail" type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
