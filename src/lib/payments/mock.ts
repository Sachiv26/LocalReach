import type { PaymentProvider, ProviderCheckoutInput, CheckoutSession } from "./provider";
import { env } from "@/lib/env";

/**
 * Development / demo payment provider.
 * No real money moves. The checkout URL points at a local mock page which
 * calls a server-side endpoint to simulate the provider webhook — the same
 * code path a real provider would take. Disabled in production.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "MOCK" as const;

  async createCheckout(input: ProviderCheckoutInput): Promise<CheckoutSession> {
    const base = env.appUrl;
    const params = new URLSearchParams({
      paymentId: input.paymentId,
      orderId: input.orderId,
      amount: input.amount.toFixed(2),
      item: input.itemName,
    });
    return {
      paymentId: input.paymentId,
      orderId: input.orderId,
      provider: "MOCK",
      checkoutUrl: `${base}/payments/mock?${params.toString()}`,
    };
  }

  async verifyNotification(payload: Record<string, string>) {
    const reference = payload.m_payment_id ?? "";
    const status = (payload.payment_status ?? "").toUpperCase();
    if (status === "COMPLETE") {
      return {
        ok: true,
        paymentReference: reference,
        status: "PAID" as const,
        amount: payload.amount_gross ? Number(payload.amount_gross) : undefined,
      };
    }
    if (status === "CANCELLED") {
      return { ok: true, paymentReference: reference, status: "CANCELLED" as const };
    }
    return { ok: true, paymentReference: reference, status: "FAILED" as const };
  }
}
