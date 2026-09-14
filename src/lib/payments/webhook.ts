import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { activateBoost } from "@/lib/ads/admin";
import { recordRevenue } from "@/lib/revenue/service";
import { notify } from "@/lib/notifications/service";
import { recordAudit } from "@/lib/audit/service";

/**
 * Marks a payment PAID in a transaction, activates the purchased item and
 * records revenue. Idempotent: re-delivered webhooks for an already-paid
 * payment short-circuit with success.
 */
export async function markPaymentPaid(
  paymentId: string,
  providerReference?: string
): Promise<{ idempotent: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw new AppError("NOT_FOUND", "Payment not found.");
  if (payment.status === "PAID") return { idempotent: true };

  const order = payment.order;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        providerReference: providerReference ?? payment.providerReference,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });
  });

  try {
    await activateOrderItem(order.id);
  } catch (err) {
    logger.error("Failed to activate paid order — needs manual review", {
      err: String(err),
      orderId: order.id,
    });
  }

  if (order.communityId) {
    await recordRevenue(payment.id);
  }

  await notify({
    userId: payment.userId,
    type: "PAYMENT_SUCCESS",
    title: "Payment successful",
    body: `Your payment of R${Number(payment.amount).toFixed(2)} was received. Reference: ${payment.id.slice(0, 8).toUpperCase()}.`,
    data: { paymentId: payment.id, orderId: order.id },
    email: true,
  });
  await recordAudit({
    actorId: null,
    communityId: order.communityId,
    action: "PAYMENT_RECORDED",
    entityType: "Payment",
    entityId: payment.id,
    newValues: { status: "PAID", amount: Number(payment.amount) },
  });

  return { idempotent: false };
}

/** Activates the purchased item for a paid order. */
async function activateOrderItem(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { plan: true },
  });

  if (order.itemType === "ADVERT_BOOST" && order.advertId) {
    await activateBoost(
      order.advertId,
      order.planKey === "PREMIUM" ? "PREMIUM" : "BOOST",
      order.plan.boostDurationDays ?? 14
    );
    return;
  }

  if (order.itemType === "BUSINESS_SUBSCRIPTION" && order.businessId) {
    const months =
      order.months ??
      (order.planKey === "BUSINESS_ANNUAL"
        ? 12
        : order.plan.billingPeriod === "MONTHLY"
          ? 1
          : 12);
    const periodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.upsert({
          where: { id: order.id },
      create: {
        userId: order.userId,
        communityId: order.communityId as string,
        businessId: order.businessId,
        planKey: order.planKey,
        planId: order.planId,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
      update: {
        planKey: order.planKey,
        planId: order.planId,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
    });
    await prisma.businessProfile.update({
      where: { id: order.businessId },
      data: { featuredUntil: periodEnd },
    });
    return;
  }

  if (order.itemType === "BUSINESS_VERIFICATION" && order.businessId) {
    await prisma.businessProfile.update({
      where: { id: order.businessId },
      data: { verificationStatus: "PENDING" },
    });
    return;
  }

  logger.warn("Paid order has no activatable item", { orderId });
}

/** Marks a payment FAILED/CANCELLED (idempotent). */
export async function markPaymentTerminal(
  paymentId: string,
  status: "FAILED" | "CANCELLED"
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;
  await prisma.payment.update({ where: { id: paymentId }, data: { status } });
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: status === "FAILED" ? "FAILED" : "CANCELLED" },
  });
  if (status === "FAILED") {
    await notify({
      userId: payment.userId,
      type: "PAYMENT_FAILED",
      title: "Payment failed",
      body: "Your payment could not be completed. You can try again.",
      data: { paymentId },
    });
  }
}
