import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { computeRevenueSplit, getEffectiveSplitRule } from "./split";
import type { Prisma } from "@prisma/client";

/** Records a RevenueTransaction for a PAID payment (idempotent via unique paymentId). */
export async function recordRevenue(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment || !payment.communityId) {
    throw new AppError("VALIDATION", "Payment has no community for revenue split.");
  }
  const existing = await prisma.revenueTransaction.findUnique({
    where: { paymentId },
  });
  if (existing) return; // idempotent

  const rule = await getEffectiveSplitRule(payment.communityId);
  const gross = Number(payment.amount);
  const split = computeRevenueSplit(gross, rule);

  await prisma.revenueTransaction.create({
    data: {
      communityId: payment.communityId,
      paymentId,
      orderId: payment.orderId,
      grossAmount: gross,
      platformAmount: split.platformAmount,
      communityAmount: split.communityAmount,
      adminAmount: split.adminAmount,
      currency: payment.currency,
    },
  });
  logger.info("Revenue recorded", {
    paymentId,
    communityId: payment.communityId,
    gross,
    ...split,
  });
}

/** Community earnings summary for the admin dashboard. */
export async function getCommunityEarnings(communityId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthAgg, allAgg, payouts, boosts, subscriptions] = await Promise.all([
    prisma.revenueTransaction.aggregate({
      where: { communityId, createdAt: { gte: monthStart } },
      _sum: { communityAmount: true, grossAmount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { communityId },
      _sum: { communityAmount: true },
    }),
    prisma.communityPayout.groupBy({
      by: ["status"],
      where: { communityId },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: { communityId, itemType: "ADVERT_BOOST", status: "PAID" },
    }),
    prisma.subscription.count({
      where: { communityId, status: "ACTIVE" },
    }),
  ]);

  const sumByStatus = (status: string) =>
    payouts.find((p) => p.status === status)?._sum.amount ?? 0;

  return {
    thisMonth: Number(monthAgg._sum.communityAmount ?? 0),
    grossThisMonth: Number(monthAgg._sum.grossAmount ?? 0),
    totalEarned: Number(allAgg._sum.communityAmount ?? 0),
    pendingPayout:
      Number(sumByStatus("PENDING_PAYOUT")) + Number(sumByStatus("APPROVED")),
    paidOut: Number(sumByStatus("PAID")),
    paidBoosts: boosts,
    businessSubscriptions: subscriptions,
  };
}

/** Platform-wide revenue summary for the super admin dashboard. */
export async function getPlatformRevenue() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [monthAgg, allAgg, byCommunity] = await Promise.all([
    prisma.revenueTransaction.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { platformAmount: true, communityAmount: true, grossAmount: true },
    }),
    prisma.revenueTransaction.aggregate({
      _sum: { platformAmount: true, communityAmount: true, grossAmount: true },
    }),
    prisma.revenueTransaction.groupBy({
      by: ["communityId"],
      _sum: { communityAmount: true, platformAmount: true, grossAmount: true },
      orderBy: { _sum: { communityAmount: "desc" } },
    }),
  ]);
  return {
    thisMonth: {
      gross: Number(monthAgg._sum.grossAmount ?? 0),
      platform: Number(monthAgg._sum.platformAmount ?? 0),
      community: Number(monthAgg._sum.communityAmount ?? 0),
    },
    allTime: {
      gross: Number(allAgg._sum.grossAmount ?? 0),
      platform: Number(allAgg._sum.platformAmount ?? 0),
      community: Number(allAgg._sum.communityAmount ?? 0),
    },
    byCommunity,
  };
}

export type PayoutRow = Prisma.CommunityPayoutGetPayload<{
  include: { community: { select: { name: true, slug: true } } };
}>;

export async function listPayouts(
  communityId?: string,
  page = 1,
  pageSize = 20
) {
  const where = communityId ? { communityId } : {};
  const [items, total] = await Promise.all([
    prisma.communityPayout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { community: { select: { name: true, slug: true } } },
    }),
    prisma.communityPayout.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
