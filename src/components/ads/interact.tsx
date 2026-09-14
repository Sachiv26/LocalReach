"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Flag, Heart, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { reportAdvertAction, toggleSaveAdvertAction, recordInteractionAction } from "@/lib/actions/ads";

/** Photo gallery with keyboard-friendly controls. */
export function Gallery({ images, title }: { images: { url: string; alt?: string | null }[]; title: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) {
    return <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-5xl">🏘️</div>;
  }
  const img = images[Math.min(index, images.length - 1)]!;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <Image src={img.url} alt={img.alt ?? title} width={1200} height={900} className="aspect-[4/3] w-full object-cover" priority={index === 0} />
      {images.length > 1 ? (
        <div className="flex h-10 items-center justify-between bg-white px-3">
          <button onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label="Previous photo" className="rounded-lg p-1.5 hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex gap-1.5">
            {images.map((it, i) => (
              <button key={it.url} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-brand-600" : "w-2 bg-gray-300"}`} />
            ))}
          </div>
          <button onClick={() => setIndex((index + 1) % images.length)} aria-label="Next photo" className="rounded-lg p-1.5 hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
        </div>
      ) : null}
    </div>
  );
}

/** Save, share and report controls. */
export function AdvertActions({
  advertId,
  title,
  slug,
  initialSaved,
}: {
  advertId: string;
  title: string;
  slug: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function track(type: "WHATSAPP_CLICK" | "PHONE_CLICK" | "WEBSITE_CLICK" | "SHARE") {
    await recordInteractionAction({ advertId, type });
  }

  async function save() {
    const res = await toggleSaveAdvertAction({ advertId });
    if (res.ok) {
      setSaved(res.data.saved);
      toast(res.data.saved ? "Saved ⭐" : "Removed from saved", "success");
    } else {
      toast(res.message, "error");
    }
  }

  function share() {
    void track("SHARE");
    const text = `${title}\n\nView on LocalReach: ${window.location.origin}/ads/${slug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => { void track("WHATSAPP_CLICK"); share(); }}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1eb957]"
      >
        <MessageCircle className="h-5 w-5" aria-hidden /> Share on WhatsApp
      </button>
      <button onClick={save} className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${saved ? "bg-brand-100 text-brand-800" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>
        <Heart className={`h-5 w-5 ${saved ? "fill-brand-600 text-brand-600" : ""}`} aria-hidden /> {saved ? "Saved" : "Save"}
      </button>
      <button onClick={() => setReportOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-500 hover:bg-gray-50" aria-label="Report advert">
        <Flag className="h-5 w-5" aria-hidden /> Report
      </button>
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this advert">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void setBusy(true);
            void reportAdvertAction({
              advertId,
              reason: String(fd.get("reason")),
              details: String(fd.get("details") ?? ""),
            }).then((res) => {
              setBusy(false);
              setReportOpen(false);
              if (res.ok) toast("Thanks — we’ll review this report.", "success");
              else toast(res.message, "error");
            });
          }}
        >
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
          <select id="reason" name="reason" required className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm">
            {["SCAM", "PROHIBITED_ITEM", "INAPPROPRIATE_CONTENT", "SPAM", "FALSE_INFORMATION", "DUPLICATE", "OTHER"].map((r) => (
              <option key={r} value={r}>{r.replaceAll("_", " ")}</option>
            ))}
          </select>
          <textarea name="details" rows={3} placeholder="Optional details" className="min-h-20 w-full rounded-lg border border-gray-300 p-3 text-sm" />
          <button disabled={busy} className="h-11 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Submitting…" : "Send report"}
          </button>
        </form>
      </Modal>
    </div>
  );
}