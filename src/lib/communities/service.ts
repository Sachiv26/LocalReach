import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { recordAudit } from "@/lib/audit/service";
import { defaultCategories, defaultPlans } from "@/lib/communities/defaults";
import { defaultRules } from "@/lib/communities/rules-default";
import {
  DEFAULT_DETAILED_TEMPLATE,
  DEFAULT_SHORT_TEMPLATE,
} from "@/lib/whatsapp/templates";

export type CommunityOverview = Prisma.CommunityGetPayload<{}>;

export async function getCommunityBySlug(slug: string) {
  return prisma.community.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          adverts: { where: { status: "PUBLISHED", deletedAt: null } },
          businesses: { where: { deletedAt: null } },
          members: true,
        },
      },
    },
  });
}

export async function listPublicCommunities() {
  return prisma.community.findMany({
    where: {
      deletedAt: null,
      status: { in: ["ACTIVE", "PILOT"] },
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          adverts: { where: { status: "PUBLISHED", deletedAt: null } },
          businesses: { where: { deletedAt: null } },
          members: true,
        },
      },
    },
  });
}

export type CreateCommunityInput = {
  name: string;
  description?: string;
  suburb?: string;
  city?: string;
  province?: string;
  timezone?: string;
  adminEmail: string;
  adminName?: string;
  whatsappInviteUrl?: string;
  revenueSharePercentage?: number; // community share
};

/**
 * Community onboarding: creates the tenant, its owner admin, default
 * categories, rules, pricing plans and revenue share rule in one transaction.
 */
export async function createCommunityWithDefaults(
  input: CreateCommunityInput,
  actorId: string
) {
  const slug = slugify(input.name);
  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) throw new AppError("CONFLICT", "A community with a similar name already exists.");

  const adminEmail = input.adminEmail.toLowerCase();
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  const community = await prisma.$transaction(async (tx) => {
    const created = await tx.community.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        suburb: input.suburb,
        city: input.city,
        province: input.province ?? "KwaZulu-Natal",
        timezone: input.timezone ?? "Africa/Johannesburg",
        status: "PILOT",
        pilotStart: new Date(),
        whatsappInviteUrl: input.whatsappInviteUrl ?? null,
      },
    });

    if (!adminUser) {
      adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          name: input.adminName ?? input.adminEmail.split("@")[0],
          roles: { create: [{ role: "COMMUNITY_OWNER" }] },
        },
      });
    } else {
      await tx.userRole.upsert({
        where: {
          userId_role: { userId: adminUser.id, role: "COMMUNITY_OWNER" },
        },
        create: { userId: adminUser.id, role: "COMMUNITY_OWNER" },
        update: {},
      });
    }

    await tx.communityAdmin.create({
      data: {
        userId: adminUser.id,
        communityId: created.id,
        role: "COMMUNITY_OWNER",
      },
    });
    await tx.communityMember.create({
      data: { userId: adminUser.id, communityId: created.id },
    });

    await tx.communityRule.createMany({
      data: defaultRules(created.id),
    });

    await tx.category.createMany({
      data: defaultCategories(created.id),
    });

    await tx.pricingPlan.createMany({
      data: defaultPlans(created.id),
    });

    await tx.revenueShareRule.create({
      data: {
        communityId: created.id,
        platformPercentage: 100 - (input.revenueSharePercentage ?? 30),
        communityPercentage: input.revenueSharePercentage ?? 30,
      },
    });

    await tx.whatsAppTemplate.createMany({
      data: [
        {
          communityId: created.id,
          templateKey: "SHORT",
          name: "Short WhatsApp advert",
          body: DEFAULT_SHORT_TEMPLATE,
        },
        {
          communityId: created.id,
          templateKey: "DETAILED",
          name: "Detailed WhatsApp advert",
          body: DEFAULT_DETAILED_TEMPLATE,
        },
      ],
    });

    return created;
  });

  await recordAudit({
    actorId,
    communityId: community.id,
    action: "COMMUNITY_CREATED",
    entityType: "Community",
    entityId: community.id,
    newValues: { name: community.name, slug: community.slug },
  });

  return community;
}
