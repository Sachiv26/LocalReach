import crypto from "node:crypto";
import type { PaymentProvider } from "./provider";
import { PayFastProvider } from "./payfast";
import { MockPaymentProvider } from "./mock";
import { env } from "@/lib/env";
import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";

export function getPaymentProvider(): PaymentProvider {
  if (env.payfastEnabled) {
    return new PayFastProvider({
      merchantId: env.PAYFAST_MERCHANT_ID as string,
      merchantKey: env.PAYFAST_MERCHANT_KEY as string,
      passphrase: env.PAYFAST_PASSPHRASE || undefined,
      mode: env.PAYFAST_MODE,
    });
  }
  if (env.isProd) {
    throw new AppError(
      "PAYMENT_ERROR",
      "Online payments are not configured yet. Please contact support."
    );
  }
  return new MockPaymentProvider();
}

export type StartCheckoutInput = {
  userId: string;
  communityId?: string | null;
  itemType: "ADVERT_BOOST" | "BUSINESS_SUBSCRIPTION" | "BUSINESS_VERIFICATION";
  planKey:
    | "BOOST"
    | "PREMIUM"
    | "BUSINESS_MONTHLY"
    | "BUSINESS_ANNUAL"
    | "VERIFIED_BUSINESS";
  advertId?: string;
  businessId?: string;
  months?: number;
  origin: string; // request origin for return/notify URLs
};

/**
 * Creates an Order + pending Payment (server-side amounts from PricingPlan —
 * never from the client) and returns the provider checkout session.
 */
export async function startCheckout(input: StartCheckoutInput) {
  const plan = await resolvePlan(input.planKey, input.communityId);
  if (!plan || !plan.isActive) {
    throw new AppError("NOT_FOUND", "That plan is not available right now.");
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in to continue.");

  if (input.itemType === "ADVERT_BOOST" && input.advertId) {
    const advert = await prisma.advert.findUnique({
      where: { id: input.advertId },
    });
    if (!advert || advert.advertiserId !== input.userId) {
      throw new AppError("FORBIDDEN", "You can only boost your own adverts.");
    }
  }

  const idempotencyKey = crypto.randomUUID();
  const order = await prisma.order.create({
    data: {
      userId: input.userId,
      communityId: input.communityId ?? null,
      itemType: input.itemType,
      planKey: input.planKey,
      planId: plan.id,
      advertId: input.advertId ?? null,
      businessId: input.businessId ?? null,
      months: input.months ?? null,
      amount: plan.price,
      currency: plan.currency ?? "ZAR",
      idempotencyKey,
    },
  });

  const provider = getPaymentProvider();
  const payment = await prisma.payment.create({
    data: {
      userId: input.userId,
      communityId: input.communityId ?? null,
      orderId: order.id,
      provider: provider.name,
      amount: plan.price,
      currency: plan.currency ?? "ZAR",
      status: "PENDING",
    },
  });

  const session = await provider.createCheckout({
    paymentId: payment.id,
    orderId: order.id,
    amount: Number(plan.price),
    currency: plan.currency ?? "ZAR",
    itemName: `${plan.name} — LocalReach`,
    itemDescription: plan.description ?? plan.name,
    customer: { name: user.name, email: user.email },
    returnUrl: `${input.origin}/payments/return?paymentId=${payment.id}`,
    cancelUrl: `${input.origin}/payments/cancelled?paymentId=${payment.id}`,
    notifyUrl: `${env.appUrl}/api/webhooks/payfast`,
    custom: { orderId: order.id },
  });

  return { order, payment, session };
}

export async function resolvePlan(planKey: string, communityId?: string | null) {
  if (communityId) {
    const override = await prisma.pricingPlan.findUnique({
      where: {
        communityId_planKey: {
          communityId,
          planKey: planKey as never,
        },
      },
    });
    if (override) return override;
  }
  return prisma.pricingPlan.findFirst({
    where: { communityId: null, planKey: planKey as never },
  });
}
