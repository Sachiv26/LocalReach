"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdvertAction } from "@/lib/actions/ads";
import { ImageUploader, type UploadedImage } from "@/components/ads/image-uploader";
import { toast } from "@/components/ui/toaster";

type CommunityOption = {
  id: string;
  name: string;
  slug: string;
  maxImages: number;
  allowCollage: boolean;
  /** "Quiet hours" display string, or null when posting is allowed anytime. */
  quietHours: string | null;
};
type CategoryOption = { id: string; name: string; slug: string };

const PRICE_TYPES = ["FIXED", "NEGOTIABLE", "FREE", "FROM", "PER_DAY", "PER_MONTH", "CONTACT_SELLER"];

export function AdvertForm({
  communities,
  categories,
}: {
  communities: CommunityOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? "");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const community = communities.find((c) => c.id === communityId);

  async function submit(saveAsDraft: boolean) {
    const fd = new FormData(document.getElementById("advert-form") as HTMLFormElement);
    setBusy(true);
    setError(null);
    const res = await createAdvertAction({
      communityId,
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      categoryId: String(fd.get("categoryId") ?? ""),
      priceType: String(fd.get("priceType") ?? "FIXED"),
      price: String(fd.get("price") ?? "") === "" ? null : Number(fd.get("price")),
      suburb: String(fd.get("suburb") ?? ""),
      city: String(fd.get("city") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      contactPhone: String(fd.get("contactPhone") ?? ""),
      whatsappNumber: String(fd.get("whatsappNumber") ?? ""),
      contactEmail: String(fd.get("contactEmail") ?? ""),
      images,
      submit: !saveAsDraft,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      toast(res.message, "error");
      return;
    }
    toast(
      res.data.status === "PUBLISHED"
        ? "Your advert is live 🎉"
        : res.data.status === "PENDING_REVIEW"
          ? "Submitted — awaiting admin approval."
          : "Saved as a draft."
    );
    router.push("/dashboard/ads");
    router.refresh();
  }

  return (
    <form id="advert-form" className="space-y-6">
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">About your advert</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="communityId" className="mb-1 block text-sm font-medium text-gray-700">Community</label>
            <select id="communityId" name="communityId" value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm">
              {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {community ? <p className="mt-1 text-xs text-gray-500">{community.quietHours ? `Quiet hours: ${community.quietHours} · ` : "Posting allowed anytime · "}Max {community.maxImages} photo{community.maxImages === 1 ? "" : "s"}</p> : null}
          </div>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input id="title" name="title" required minLength={5} maxLength={120} placeholder="e.g. 3 Bedroom house for sale — Umgeni Park" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
              <select id="categoryId" name="categoryId" required className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="priceType" className="mb-1 block text-sm font-medium text-gray-700">Price type</label>
              <select id="priceType" name="priceType" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm">
                {PRICE_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">Price (R) — leave empty for “Contact seller”/“Free”</label>
            <input id="price" name="price" type="number" min={0} step="0.01" placeholder="e.g. 1850000" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
            <textarea id="description" name="description" required minLength={20} maxLength={5000} rows={5} placeholder="Describe what you’re selling — condition, features, collection…" className="min-h-28 w-full rounded-lg border border-gray-300 p-3 text-sm" />
          </div>
        </div>
      </div>
      {/* PART2 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Photos <span className="text-gray-400">(max {community?.maxImages ?? 2})</span></h2>
        <p className="mt-1 text-xs text-gray-500">Multiple products must be combined into one collage and count as one advert.</p>
        <div className="mt-3">
          <ImageUploader max={community?.maxImages ?? 2} value={images} onChange={setImages} allowCollage={community?.allowCollage ?? true} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Location</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="suburb" className="mb-1 block text-sm font-medium text-gray-700">Suburb</label>
            <input id="suburb" name="suburb" placeholder="Umgeni Park" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">City</label>
            <input id="city" name="city" placeholder="Durban" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Contact details <span className="text-gray-400">(public)</span></h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className="mb-1 block text-sm font-medium text-gray-700">Contact name *</label>
            <input id="contactName" name="contactName" required minLength={2} className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="contactPhone" className="mb-1 block text-sm font-medium text-gray-700">Phone (e.g. 0821234567)</label>
            <input id="contactPhone" name="contactPhone" placeholder="082 123 4567" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="whatsappNumber" className="mb-1 block text-sm font-medium text-gray-700">WhatsApp number (if different)</label>
            <input id="whatsappNumber" name="whatsappNumber" placeholder="082 123 4567" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input id="contactEmail" name="contactEmail" type="email" className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void submit(false)} disabled={busy} className="h-12 flex-1 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? "Submitting…" : "Submit for review"}
        </button>
        <button type="button" onClick={() => void submit(true)} disabled={busy} className="h-12 rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 disabled:opacity-50">
          Save draft
        </button>
      </div>
    </form>
  );
}
