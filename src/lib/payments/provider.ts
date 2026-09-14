/**
 * Payment provider abstraction.
 *
 * Providers are resolved from configuration: PayFast is preferred for South
 * Africa when credentials are present; a mock provider is used in development
 * when no credentials exist. Stripe (or any other gateway) can be added by
 * implementing PaymentProvider — no call-site changes required.
 *
 * SECURITY: payment success is only ever trusted from the provider webhook /
 * server-side verification — never from the browser.
 */

export type CheckoutSession = {
  paymentId: string;
  orderId: string;
  provider: "PAYFAST" | "MOCK" | "STRIPE";
  /** URL to redirect the user's browser to, or an HTML auto-submit form URL. */
  checkoutUrl: string;
  /** PayFast-style auto-submit form fields when applicable. */
  formFields?: Record<string, string>;
};

export type PaymentProviderName = "PAYFAST" | "MOCK" | "STRIPE";

export type ProviderCheckoutInput = {
  paymentId: string;
  orderId: string;
  amount: number; // ZAR
  currency: string;
  itemName: string;
  itemDescription: string;
  customer: { name?: string | null; email: string };
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  custom?: Record<string, string>;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: ProviderCheckoutInput): Promise<CheckoutSession>;
  /** Verify a provider payload server-side. Returns the payment reference on success. */
  verifyNotification(payload: Record<string, string>): Promise<{
    ok: boolean;
    paymentReference: string;
    status: "PAID" | "FAILED" | "CANCELLED";
    amount?: number;
  }>;
}

import crypto from "node:crypto";

/** Build the PayFast signature: sorted key/value concat + passphrase, MD5 uppercase. */
export function payfastSignature(
  fields: Record<string, string>,
  passphrase?: string
): string {
  const sorted = Object.keys(fields)
    .filter((k) => fields[k] !== "" && fields[k] !== undefined)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(String(fields[k])).replace(/%20/g, "+")}`)
    .join("&");
  const toSign = passphrase
    ? `${sorted}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : sorted;
  return crypto.createHash("md5").update(toSign).digest("hex").toUpperCase();
}

export function payfastProcessUrl(mode: "sandbox" | "live"): string {
  return mode === "live"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";
}
