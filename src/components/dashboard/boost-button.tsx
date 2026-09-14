"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { startBoostCheckoutAction } from "@/lib/actions/payments";
import { toast } from "@/components/ui/toaster";

/**
 * Client button that initiates a server-side checkout for a boost.
 * The price is re-resolved server-side — the client only says "boost this ad".
 */
export function BoostButton({
  advertId,
  communityId,
  label = "Boost R39",
}: {
  advertId: string;
  communityId: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void setBusy(true);
        void startBoostCheckoutAction({
          advertId,
          planKey: "BOOST",
          communityId,
        }).then((res) => {
          setBusy(false);
          if (!res.ok) {
            toast(res.message ?? "Could not start checkout.", "error");
          } else if (res.data) {
            window.location.href = res.data.checkoutUrl;
          }
        });
      }}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
    >
      <Star className="h-3.5 w-3.5" aria-hidden /> {busy ? "…" : label}
    </button>
  );
}