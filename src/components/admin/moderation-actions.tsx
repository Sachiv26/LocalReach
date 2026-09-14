"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { moderateAdvertAction } from "@/lib/actions/admin-moderation";
import { Button } from "@/components/ui/button";

const REJECT_REASONS = [
  "TOO_MANY_PHOTOS",
  "POSTING_FREQUENCY",
  "PROHIBITED_ITEM",
  "PROHIBITED_CONTENT",
  "INCORRECT_CATEGORY",
  "DUPLICATE",
  "EXTERNAL_PROMOTION",
  "OTHER",
];

const REASON_LABELS: Record<string, string> = {
  TOO_MANY_PHOTOS: "Too many photos",
  POSTING_FREQUENCY: "Posting frequency violation",
  PROHIBITED_ITEM: "Prohibited item",
  PROHIBITED_CONTENT: "Prohibited content",
  INCORRECT_CATEGORY: "Incorrect category",
  DUPLICATE: "Duplicate advert",
  EXTERNAL_PROMOTION: "External platform promotion",
  OTHER: "Other (add note below)",
};

export function ModerationActions({
  communityId,
  advertId,
}: {
  communityId: string;
  advertId: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<"APPROVE" | "REJECT" | "REQUEST_CHANGES">(
    "APPROVE"
  );
  const [reason, setReason] = useState("OTHER");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const res = await moderateAdvertAction(communityId, {
      advertId,
      action,
      reason: action !== "APPROVE" ? `${reason}${notes ? ` — ${notes}` : ""}` : undefined,
      notes: notes || undefined,
    });
    setBusy(false);
    if (res.ok) {
      setMessage("Decision saved. ✓");
      router.refresh();
    } else {
      setMessage(res.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Take action</h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Moderation decision">
        {(["APPROVE", "REJECT", "REQUEST_CHANGES"] as const).map((a) => (
          <label key={a} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="action"
              value={a}
              checked={action === a}
              onChange={() => setAction(a)}
              className="h-4 w-4 accent-brand-600"
            />
            <span>{a === "REQUEST_CHANGES" ? "Request changes" : a.charAt(0) + a.slice(1).toLowerCase()}</span>
          </label>
        ))}
      </div>

      {action !== "APPROVE" ? (
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Rejection reason</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {REJECT_REASONS.map((r) => (
              <option key={r} value={r}>{REASON_LABELS[r]}</option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-gray-700">Private notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="e.g. Advert references an external WhatsApp link."
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </label>

      {message ? (
        <p role="status" className="text-sm text-gray-700">{message}</p>
      ) : null}

      <Button
        type="button"
        variant={action === "REJECT" ? "danger" : "primary"}
        disabled={busy}
        onClick={() => void submit()}
      >
        {busy
          ? "Saving…"
          : action === "APPROVE"
            ? "Approve advert"
            : action === "REJECT"
              ? "Reject advert"
              : "Request changes"}
      </Button>
    </div>
  );
}