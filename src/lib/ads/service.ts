import type { Community, Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { quotaStatus, type QuotaStatus } from "@/lib/ads/quota";
import {
  isWithinPostingHours,
  describeQuietHours,
} from "@/lib/ads/posting-hours";
import { runModeration } from "@/lib/moderation";
import { findDuplicate } from "@/lib/moderation/duplicate";
import { generateSlug } from "@/lib/utils";
import { notify } from "@/lib/notifications/service";
import { recordAudit } from "@/lib/audit/service";
import type { CreateAdvertInput } from "@/lib/ads/validation";
import type { RuleViolation } from "@/lib/rules/engine";

/** DB-backed quota status for a user in a community. */
export async function getQuotaStatus(
  userId: string,
  community: Pick<Community, "id" | "freeAdLimit" | "freeAdPeriodDays">
): Promise<QuotaStatus> {
  const usage = await prisma.advertQuotaUsage.findMany({
    where: { userId, communityId: community.id, quotaType: "FREE_ADVERT" },
    select: { createdAt: true, quotaType: true },
  });
  return quotaStatus(
    usage,
    community.freeAdLimit,
    community.freeAdPeriodDays,
    new Date()
  );
}

/** Active rules for a community (rules engine input). */
export async function getCommunityRules(communityId: string) {
  return prisma.communityRule.findMany({
    where: { communityId, enabled: true },
  });
}

async function assertUserCanAdvertise(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw new AppError("UNAUTHORIZED", "Please sign in to continue.");
  }
  if (user.bannedAt) {
    throw new AppError("FORBIDDEN", "Your account has been suspended.");
  }
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    throw new AppError(
      "FORBIDDEN",
      `Your advertising privileges are temporarily restricted until ${user.suspendedUntil.toLocaleDateString("en-ZA")}.`
    );
  }
  return user;
}

export type SubmitOutcome = {
  advert: { id: string; slug: string; title: string; status: string };
  status: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED" | "DRAFT";
  moderation: {
    decision: string;
    riskScore: number;
    reasons: string[];
  } | null;
  quota: QuotaStatus | null;
};

/**
 * Creates an advert (draft or submission) with full server-side enforcement:
 * quota, posting hours, image limits, rule engine, automated moderation and
 * duplicate detection. This is the ONLY path for creating adverts.
 */
export async function submitAdvert(
  input: CreateAdvertInput,
  userId: string,
  opts?: { overridePostingHours?: boolean }
): Promise<SubmitOutcome> {
  const community = await prisma.community.findUnique({
    where: { id: input.communityId },
  });
  if (!community || community.deletedAt) {
    throw new AppError("NOT_FOUND", "Community not found.");
  }
  if (community.status === "CLOSED") {
    throw new AppError("FORBIDDEN", "This community is not accepting adverts.");
  }

  const user = await assertUserCanAdvertise(userId);

  // Category must belong to this community and be allowed
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category || category.communityId !== community.id || !category.isActive) {
    throw new AppError("VALIDATION", "Please choose a valid category.");
  }
  if (category.isProhibited) {
    throw new AppError(
      "RULE_BLOCKED",
      `The “${category.name}” category is not allowed in this community.`
    );
  }

  // Server-side image limit — never trust client-side validation
  const maxImages = community.maxAdImages;
  if (input.images.length > maxImages) {
    throw new AppError(
      "RULE_BLOCKED",
      `Maximum ${maxImages} photo${maxImages === 1 ? "" : "s"} per advert. Multiple products must be combined into one collage.`
    );
  }

  const isDraft = !input.submit;
  if (!isDraft) {
    // Posting hours (quiet hours rule). Admins may override via opts.
    const withinHours = isWithinPostingHours(new Date(), {
      timezone: community.timezone,
      startHour: community.postingStartHour,
      endHour: community.postingEndHour,
    });
    if (!withinHours && !opts?.overridePostingHours) {
      throw new AppError(
        "POSTING_HOURS",
        `Adverts cannot be submitted between ${describeQuietHours({
          timezone: community.timezone,
          startHour: community.postingStartHour,
          endHour: community.postingEndHour,
        })} (${community.timezone}). Please try again after quiet hours.`
      );
    }

    // Free advert quota (tracked through AdvertQuotaUsage — never counted from rows)
    const quota = await getQuotaStatus(userId, community);
    if (quota.exhausted) {
      throw new AppError(
        "QUOTA_EXCEEDED",
        `You have used all ${community.freeAdLimit} free adverts for this period.${
          quota.resetAt
            ? ` Your next free advert unlocks on ${quota.resetAt.toLocaleDateString("en-ZA")}.`
            : ""
        } You can boost an advert to publish immediately.`,
        { quota }
      );
    }
  }

  // Duplicate detection against the advertiser's own recent adverts
  const recent = await prisma.advert.findMany({
    where: {
      advertiserId: userId,
      communityId: community.id,
      deletedAt: null,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: { in: ["DRAFT", "PENDING_REVIEW", "APPROVED", "PUBLISHED"] },
    },
    select: { id: true, title: true, description: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const duplicate = findDuplicate(input.title, input.description, recent);

  // Automated moderation: rules + content checks (+ optional external API)
  const moderation = await runModeration({
    title: input.title,
    description: input.description,
    categorySlug: category.slug,
    categoryNames: [category.name],
    imagesCount: input.images.length,
    rules: await getCommunityRules(community.id),
    communityTimezone: community.timezone,
    userAgeDays: user.createdAt
      ? Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : 0,
    quotaUsed: 0,
    advertDurationDays: community.maxAdDurationDays,
  });

  if (duplicate.isDuplicate) {
    moderation.reasons.push("Possible duplicate of one of your recent adverts");
    moderation.riskScore = Math.max(moderation.riskScore, 55);
    if (moderation.decision === "SAFE") moderation.decision = "REVIEW";
  }

  // Decide outcome
  let status: "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  let moderationStatus: "PENDING" | "AUTO_APPROVED" | "APPROVED" | "PENDING_REVIEW" | "REJECTED";

  if (isDraft) {
    status = "DRAFT";
    moderationStatus = "PENDING";
  } else if (moderation.decision === "BLOCK") {
    status = "REJECTED";
    moderationStatus = "REJECTED";
  } else if (moderation.decision === "REVIEW" || community.requireApproval) {
    status = "PENDING_REVIEW";
    moderationStatus = "PENDING";
  } else {
    status = "PUBLISHED";
    moderationStatus = "AUTO_APPROVED";
  }

  const now = new Date();
  const expiresAt =
    status === "PUBLISHED"
      ? new Date(now.getTime() + community.maxAdDurationDays * 24 * 60 * 60 * 1000)
      : null;

  const advert = await prisma.advert.create({
    data: {
      communityId: community.id,
      advertiserId: userId,
      title: input.title,
      slug: generateSlug(input.title),
      description: input.description,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId ?? null,
      price: input.price ?? null,
      priceType: input.priceType,
      suburb: input.suburb || null,
      city: input.city || null,
      location: input.location || null,
      contactName: input.contactName,
      contactPhone: input.contactPhone || null,
      contactEmail: input.contactEmail || null,
      whatsappNumber: input.whatsappNumber || null,
      externalWebsite: input.externalWebsite || null,
      status,
      moderationStatus,
      visibility: input.visibility,
      automatedDecision: moderation.decision,
      riskScore: moderation.riskScore,
      moderationReasons: moderation.reasons,
      publishedAt: status === "PUBLISHED" ? now : null,
      expiresAt,
      images: {
        create: input.images.map((img, i) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl ?? null,
          alt: img.alt ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
          sizeBytes: img.sizeBytes ?? null,
          mimeType: img.mimeType ?? null,
          sortOrder: i,
        })),
      },
    },
  });

  // Quota is consumed on submission (blocked submissions are not counted;
  // drafts do not consume quota). Paid boosts bypass the free quota.
  let quotaAfter: QuotaStatus | null = null;
  if (status !== "DRAFT" && status !== "REJECTED") {
    await prisma.advertQuotaUsage.create({
      data: {
        userId,
        communityId: community.id,
        advertId: advert.id,
        quotaType: "FREE_ADVERT",
      },
    });
    quotaAfter = await getQuotaStatus(userId, community);
  }

  // Notifications
  if (status === "REJECTED") {
    await notify({
      userId,
      type: "AD_REJECTED",
      title: "Advert not posted",
      body: `Your advert “${advert.title}” was not posted. Reason: ${moderation.reasons.join("; ") || "prohibited content"}. You can edit it and submit again.`,
      data: { advertId: advert.id },
      email: true,
    });
  } else if (status === "PENDING_REVIEW") {
    await notify({
      userId,
      type: "ADVERT_SUBMITTED",
      title: "Advert submitted",
      body: `Your advert “${advert.title}” has been submitted and is awaiting approval.`,
      data: { advertId: advert.id },
    });
  } else if (status === "PUBLISHED") {
    await notify({
      userId,
      type: "AD_APPROVED",
      title: "Advert live",
      body: `Your advert “${advert.title}” is now live.`,
      data: { advertId: advert.id },
      email: true,
    });
  }

  if (quotaAfter && quotaAfter.remaining === 0) {
    await notify({
      userId,
      type: "QUOTA_WARNING",
      title: "Free advert quota reached",
      body: `You have used all ${community.freeAdLimit} free adverts for this period.`,
      data: { communityId: community.id },
    });
  }

  return {
    advert: {
      id: advert.id,
      slug: advert.slug,
      title: advert.title,
      status: advert.status,
    },
    status,
    moderation: {
      decision: moderation.decision,
      riskScore: moderation.riskScore,
      reasons: moderation.reasons,
    },
    quota: quotaAfter,
  };
}

// ─────────────────────────────── Queries ───────────────────────────────

export type AdvertListFilters = {
  communityId?: string;
  categorySlug?: string;
  categoryIds?: string[];
  q?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  advertiserId?: string;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "featured";
  page?: number;
  pageSize?: number;
  includeAllStatuses?: boolean;
};

const advertListInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  category: { select: { name: true, slug: true } },
  advertiser: { select: { id: true, name: true } },
  business: { select: { businessName: true, slug: true, logo: true } },
  community: { select: { name: true, slug: true } },
} satisfies Prisma.AdvertInclude;

export async function listAdverts(filters: AdvertListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const where = buildAdvertWhere(filters);
  const [items, total] = await Promise.all([
    prisma.advert.findMany({
      where,
      include: advertListInclude,
      orderBy: buildAdvertOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.advert.count({ where }),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Valid advert status strings, used to safely validate user-supplied filters. */
const ADVERT_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "REJECTED",
  "EXPIRED",
  "SUSPENDED",
  "ARCHIVED",
] as const;

type AdvertStatusValue = (typeof ADVERT_STATUSES)[number];

function isAdvertStatus(value: string): value is AdvertStatusValue {
  return (ADVERT_STATUSES as readonly string[]).includes(value);
}

function buildAdvertWhere(filters: AdvertListFilters): Prisma.AdvertWhereInput {
  // An explicit status filter (validated) always wins — used by admin
  // listings and moderation queues. Otherwise admins with
  // includeAllStatuses see everything, and the public sees live adverts.
  const statusFilter =
    filters.status && isAdvertStatus(filters.status)
      ? { status: filters.status }
      : null;
  return {
    deletedAt: null,
    ...(statusFilter ??
      (filters.includeAllStatuses
        ? {}
        : {
            status: "PUBLISHED" as const,
            visibility: "PUBLIC" as const,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          })),
    ...(filters.communityId ? { communityId: filters.communityId } : {}),
    ...(filters.advertiserId ? { advertiserId: filters.advertiserId } : {}),
    ...(filters.categoryIds && filters.categoryIds.length
      ? { categoryId: { in: filters.categoryIds } }
      : {}),
    ...(filters.featured ? { isFeatured: true } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" as const } },
            { description: { contains: filters.q, mode: "insensitive" as const } },
            { suburb: { contains: filters.q, mode: "insensitive" as const } },
            { city: { contains: filters.q, mode: "insensitive" as const } },
            {
              business: {
                businessName: {
                  contains: filters.q,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };
}

function buildAdvertOrderBy(
  sort: AdvertListFilters["sort"]
): Prisma.AdvertOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ isFeatured: "desc" }, { price: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ isFeatured: "desc" }, { price: "desc" }, { createdAt: "desc" }];
    case "newest":
      // Strict submission order — used by moderation queues where featured
      // placement must not influence review order.
      return [{ createdAt: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

export async function getAdvertBySlug(slug: string) {
  return prisma.advert.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      subcategory: true,
      advertiser: { select: { id: true, name: true, createdAt: true } },
      business: true,
      community: true,
    },
  });
}

export async function getRelatedAdverts(
  advertId: string,
  categoryId: string,
  communityId: string,
  take = 4
) {
  return prisma.advert.findMany({
    where: {
      id: { not: advertId },
      categoryId,
      communityId,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: advertListInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function expireAdverts(): Promise<number> {
  const result = await prisma.advert.updateMany({
    where: {
      status: { in: ["PUBLISHED", "APPROVED"] },
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

/** Privacy-conscious analytics: no IPs, no personal identifiers in interactions. */
export async function recordInteraction(
  advertId: string,
  type:
    | "VIEW"
    | "WHATSAPP_CLICK"
    | "PHONE_CLICK"
    | "WEBSITE_CLICK"
    | "SAVE"
    | "SHARE"
    | "REPORT",
  userId?: string | null
) {
  try {
    if (type === "VIEW") {
      const day = new Date(new Date().toISOString().slice(0, 10));
      await prisma.$transaction([
        prisma.advert.update({
          where: { id: advertId },
          data: { viewCount: { increment: 1 } },
        }),
        prisma.advertView.upsert({
          where: { advertId_day: { advertId, day } },
          create: { advertId, day, count: 1 },
          update: { count: { increment: 1 } },
        }),
      ]);
    }
    await prisma.advertInteraction.create({
      data: { advertId, type, userId: userId ?? null },
    });
  } catch (err) {
    console.error("recordInteraction failed", err);
  }
}
