import {
  payfastProcessUrl,
  payfastSignature,
  type PaymentProvider,
  type ProviderCheckoutInput,
  type CheckoutSession,
} from "./provider";
import { env } from "@/lib/env";

/**
 * PayFast (South Africa) provider.
 *
 * Flow: browser auto-submits a signed form to PayFast → user pays →
 * PayFast POSTs an ITN (Instant Transaction Notification) to our notify_url →
 * we verify the signature + amount server-side before activating anything.
 */
export class PayFastProvider implements PaymentProvider {
  readonly name = "PAYFAST" as const;
  private merchantId: string;
  private merchantKey: string;
  private passphrase?: string;
  private mode: "sandbox" | "live";

  constructor(config: {
    merchantId: string;
    merchantKey: string;
    passphrase?: string;
    mode?: "sandbox" | "live";
  }) {
    this.merchantId = config.merchantId;
    this.merchantKey = config.merchantKey;
    this.passphrase = config.passphrase;
    this.mode = config.mode ?? "sandbox";
  }

  async createCheckout(input: ProviderCheckoutInput): Promise<CheckoutSession> {
    const [firstName, ...rest] = (input.customer.name ?? "").split(" ");
    const fields: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      notify_url: input.notifyUrl,
      name_first: firstName || "LocalReach",
      name_last: rest.join(" ") || "Customer",
      email_address: input.customer.email,
      m_payment_id: input.paymentId,
      amount: input.amount.toFixed(2),
      item_name: input.itemName.slice(0, 100),
      item_description: input.itemDescription.slice(0, 255),
      custom_str1: input.orderId,
      custom_str2: input.paymentId,
    };

    const signature = payfastSignature(fields, this.passphrase);
    const formFields = { ...fields, signature };

    // Fallback GET URL (PayFast also accepts signed query params).
    const qs = Object.entries(formFields)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    return {
      paymentId: input.paymentId,
      orderId: input.orderId,
      provider: "PAYFAST",
      checkoutUrl: `${payfastProcessUrl(this.mode)}?${qs}`,
      formFields,
    };
  }

  async verifyNotification(payload: Record<string, string>) {
    const received = payload.signature ?? "";
    const { signature: _omit, ...rest } = payload;
    const expected = payfastSignature(rest as Record<string, string>, this.passphrase);

    const paymentStatus = (payload.payment_status ?? "").toUpperCase();
    const reference = payload.m_payment_id ?? "";

    if (received !== expected) {
      return { ok: false, paymentReference: reference, status: "FAILED" as const };
    }
    // Merchant guard
    if (payload.merchant_id && payload.merchant_id !== this.merchantId) {
      return { ok: false, paymentReference: reference, status: "FAILED" as const };
    }
    if (paymentStatus === "COMPLETE") {
      return {
        ok: true,
        paymentReference: reference,
        status: "PAID" as const,
        amount: payload.amount_gross ? Number(payload.amount_gross) : undefined,
      };
    }
    if (paymentStatus === "CANCELLED") {
      return { ok: true, paymentReference: reference, status: "CANCELLED" as const };
    }
    return { ok: true, paymentReference: reference, status: "FAILED" as const };
  }
}

export function payfastConfigured(): boolean {
  return Boolean(env.PAYFAST_MERCHANT_ID && env.PAYFAST_MERCHANT_KEY);
}
