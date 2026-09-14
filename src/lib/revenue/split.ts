import prisma from "@/lib/db";

export type SplitRule = {
  platformPercentage: number; // e.g. 70
  communityPercentage: number; // e.g. 30
  adminPercentage?: number | null;
};

export type RevenueSplit = {
  platformAmount: number;
  communityAmount: number;
  adminAmount: number | null;
};

/**
 * Pure revenue split calculation.
 * Example: R39 with 70/30 → platform R27.30, community R11.70.
 * When an adminPercentage is configured it is carved out of the community share.
 */
export function computeRevenueSplit(
  grossAmount: number,
  rule: SplitRule
): RevenueSplit {
  const gross = Math.max(0, Math.round(grossAmount * 100) / 100);
  const platformShare =
    Math.round(gross * (rule.platformPercentage / 100) * 100) / 100;
  let communityShare =
    Math.round(gross * (rule.communityPercentage / 100) * 100) / 100;
  // Guard against float drift: remainder goes to community.
  const remainder = Math.round((gross - platformShare) * 100) / 100;
  if (communityShare !== remainder) communityShare = remainder;

  let adminAmount: number | null = null;
  if (rule.adminPercentage && rule.adminPercentage > 0) {
    adminAmount =
      Math.round(communityShare * (rule.adminPercentage / 100) * 100) / 100;
    communityShare = Math.round((communityShare - adminAmount) * 100) / 100;
  }

  return {
    platformAmount: platformShare,
    communityAmount: communityShare,
    adminAmount,
  };
}

/** Resolve the effective revenue-share rule (community override → platform default). */
export async function getEffectiveSplitRule(
  communityId: string
): Promise<SplitRule> {
  const now = new Date();
  const rules = await prisma.revenueShareRule.findMany({
        where: {
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  const specific = rules.find((r) => r.communityId === communityId);
  const fallback = rules.find((r) => r.communityId === null);
  const rule = specific ?? fallback;
  if (!rule) {
    return { platformPercentage: 70, communityPercentage: 30, adminPercentage: null };
  }
  return {
    platformPercentage: Number(rule.platformPercentage),
    communityPercentage: Number(rule.communityPercentage),
    adminPercentage: rule.adminPercentage ? Number(rule.adminPercentage) : null,
  };
}
