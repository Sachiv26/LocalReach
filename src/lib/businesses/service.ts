import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { generateSlug } from "@/lib/utils";
import { recordAudit } from "@/lib/audit/service";
import { notify } from "@/lib/notifications/service";
import type { z } from "zod";
import type { businessProfileSchema } from "@/lib/ads/validation";

export type BusinessWithRelations = Prisma.BusinessProfileGetPayload<{
  include: {
    category: true;
    owner: { select: { id: true; name: true } };
    community: { select: { name: true, slug: true } };
    _count: { select: { adverts: true; specials: true } };
  };
}>;

export async function createBusinessProfile(
  userId: string,
  communityId: string,
  input: z.infer<typeof businessProfileSchema>
) {
  const existing = await prisma.businessProfile.findFirst({
    where: { ownerId: userId, communityId, deletedAt: null },
  });
  if (existing) {
    throw new AppError(
      "CONFLICT",
      "You already have a business profile in this community."
    );
  }
  const business = await prisma.businessProfile.create({
    data: {
      ownerId: userId,
      communityId,
      businessName: input.businessName,
      slug: generateSlug(input.businessName),
      description: input.description,
      categoryId: input.categoryId ?? null,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      website: input.website || null,
      address: input.address || null,
      suburb: input.suburb || null,
      city: input.city || null,
      tradingHours: input.tradingHours ?? undefined,
      socialLinks: input.socialLinks ?? undefined,
      logo: input.logo || null,
      coverImage: input.coverImage || null,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId, role: "BUSINESS_OWNER" } },
    create: { userId, role: "BUSINESS_OWNER" },
    update: {},
  });
  return business;
}

export async function listBusinesses(
  filters: {
    communityId?: string;
    q?: string;
    verifiedOnly?: boolean;
    categoryId?: string;
  },
  page = 1,
  pageSize = 20
) {
  const where = {
    deletedAt: null,
    ...(filters.communityId ? { communityId: filters.communityId } : {}),
    ...(filters.verifiedOnly ? { verificationStatus: "VERIFIED" as const } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.q
      ? {
          OR: [
            { businessName: { contains: filters.q, mode: "insensitive" as const } },
            { description: { contains: filters.q, mode: "insensitive" as const } },
            { suburb: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.businessProfile.findMany({
      where,
      orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        community: { select: { name: true, slug: true } },
        _count: { select: { adverts: true, specials: true } },
      },
    }),
    prisma.businessProfile.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getBusinessBySlug(slug: string) {
  return prisma.businessProfile.findUnique({
    where: { slug },
    include: {
      category: true,
      owner: { select: { id: true, name: true } },
      community: true,
      specials: {
        where: {
          status: { in: ["ACTIVE", "SCHEDULED"] },
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
      },
      adverts: {
        where: { status: "PUBLISHED", deletedAt: null },
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      reviews: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

/**
 * Verification marks that "Business details verified by LocalReach" — it is
 * NOT a claim of trustworthiness. Checks are configurable; no sensitive
 * identity documents are required.
 */
export const VERIFICATION_CHECKS = [
  { key: "contact_details", label: "Contact details reachable and correct" },
  { key: "operating_status", label: "Business is actively operating" },
  { key: "location", label: "Trading location confirmed" },
  { key: "registration", label: "Business registration confirmed (optional)" },
];

export async function setBusinessVerification(
  businessId: string,
  adminId: string,
  status: "VERIFIED" | "REJECTED" | "EXPIRED" | "PENDING" | "NOT_VERIFIED",
  checks: Record<string, boolean> = {}
) {
  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
  });
  if (!business) throw new AppError("NOT_FOUND", "Business not found.");

  await prisma.businessProfile.update({
    where: { id: businessId },
    data: {
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      verificationChecks: Object.keys(checks).length ? checks : undefined,
    },
  });

  if (status === "VERIFIED") {
    await notify({
      userId: business.ownerId,
      type: "BUSINESS_VERIFIED",
      title: "Business verified",
      body: "Your business details have been verified by LocalReach.",
      data: { businessId },
      email: true,
    });
  }
  await recordAudit({
    actorId: adminId,
    communityId: business.communityId,
    action: status === "VERIFIED" ? "BUSINESS_VERIFIED" : "BUSINESS_UNVERIFIED",
    entityType: "BusinessProfile",
    entityId: businessId,
    newValues: { status, checks },
  });
}

export async function updateBusinessProfile(
  userId: string,
  businessId: string,
  input: Partial<z.infer<typeof businessProfileSchema>>,
  isAdmin = false
) {
  const business = await prisma.businessProfile.findUnique({
    where: { id: businessId },
  });
  if (!business || business.deletedAt) {
    throw new AppError("NOT_FOUND", "Business not found.");
  }
  if (!isAdmin && business.ownerId !== userId) {
    throw new AppError("FORBIDDEN", "You can only edit your own business.");
  }
  return prisma.businessProfile.update({
    where: { id: businessId },
    data: {
      businessName: input.businessName,
      description: input.description,
      categoryId: input.categoryId !== undefined ? input.categoryId : undefined,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      website: input.website,
      address: input.address,
      suburb: input.suburb,
      city: input.city,
      tradingHours: input.tradingHours ?? undefined,
      socialLinks: input.socialLinks ?? undefined,
      logo: input.logo,
      coverImage: input.coverImage,
    },
  });
}
