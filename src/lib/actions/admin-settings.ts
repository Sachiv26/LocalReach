"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { serializeError } from "@/lib/errors";
import { requireCommunityAdmin, requirePermission } from "@/lib/auth/access";
import { recordAudit } from "@/lib/audit/service";
import type { ActionResult } from "@/lib/actions/auth";

const payoutSchema = z.object({
  payoutId: z.string().uuid(),
  action: z.enum(["APPROVE", "MARK_PAID", "FAIL"]),
  reference: z.string().trim().max(80).optional(),
});

export async function managePayoutAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = payoutSchema.parse(input);
    const payout = await prisma.communityPayout.findUnique({ where: { id: data.payoutId } });
    if (!payout || payout.communityId !== communityId)
      return { ok: false, message: "Payout not found." };
    const next =
      data.action === "APPROVE"
        ? ("APPROVED" as const)
        : data.action === "MARK_PAID"
          ? ("PAID" as const)
          : ("FAILED" as const);
    await prisma.communityPayout.update({
      where: { id: data.payoutId },
      data: {
        status: next,
        approvedById: next === "APPROVED" ? ctx.userId : payout.approvedById,
        paidAt: next === "PAID" ? new Date() : payout.paidAt,
        reference: data.reference ?? payout.reference,
      },
    });
    if (next === "APPROVED") {
      await recordAudit({ actorId: ctx.userId, communityId, action: "PAYOUT_APPROVED", entityType: "CommunityPayout", entityId: data.payoutId });
    }
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}

const settingsSchema = z.object({
  description: z.string().trim().max(2000).optional(),
  tagline: z.string().trim().max(120).optional(),
  timezone: z.string().max(80).optional(),
  freeAdLimit: z.number().int().min(0).max(20).optional(),
  freeAdPeriodDays: z.number().int().min(1).max(60).optional(),
  maxAdImages: z.number().int().min(1).max(10).optional(),
  maxAdDurationDays: z.number().int().min(1).max(120).optional(),
  postingStartHour: z.number().int().min(0).max(23).optional(),
  postingEndHour: z.number().int().min(0).max(23).optional(),
  whatsappInviteUrl: z.string().url().optional().or(z.literal("")),
  whatsappCtaEnabled: z.boolean().optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function updateCommunitySettingsAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = settingsSchema.parse(input);
    await prisma.community.update({ where: { id: communityId }, data });
    await recordAudit({ actorId: ctx.userId, communityId, action: "COMMUNITY_UPDATED", entityType: "Community", entityId: communityId, newValues: data as any });
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input." };
    return serializeError(err);
  }
}

const revenueShareSchema = z.object({
  platformPercentage: z.number().min(0).max(100),
  communityPercentage: z.number().min(0).max(100),
});

export async function updateRevenueShareAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = revenueShareSchema.parse(input);
    if (Math.round((data.platformPercentage + data.communityPercentage) * 100) / 100 !== 100)
      return { ok: false, message: "Platform + community percentages must total 100." };
    const existing = await prisma.revenueShareRule.findFirst({ where: { communityId } });
    if (existing) {
      await prisma.revenueShareRule.update({
        where: { id: existing.id },
        data: { platformPercentage: data.platformPercentage, communityPercentage: data.communityPercentage },
      });
    } else {
      await prisma.revenueShareRule.create({
        data: { communityId, platformPercentage: data.platformPercentage, communityPercentage: data.communityPercentage },
      });
    }
    await recordAudit({ actorId: ctx.userId, communityId, action: "PRICE_CHANGED", entityType: "RevenueShareRule", newValues: data as any });
    revalidatePath("/admin/revenue");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}

const createCommunitySchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  suburb: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(80).optional(),
  adminEmail: z.string().email(),
  adminName: z.string().trim().max(80).optional(),
  whatsappInviteUrl: z.string().url().optional().or(z.literal("")),
  communityShare: z.number().min(0).max(100).optional(),
});

export async function createCommunityAction(
  input: unknown
): Promise<ActionResult<{ communityId: string; slug: string }>> {
  try {
    const ctx = await requirePermission("PLATFORM_ADMIN");
    const data = createCommunitySchema.parse(input);
    const { createCommunityWithDefaults } = await import("@/lib/communities/service");
    const community = await createCommunityWithDefaults(
      {
        name: data.name,
        description: data.description,
        suburb: data.suburb,
        city: data.city,
        province: data.province,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        whatsappInviteUrl: data.whatsappInviteUrl || undefined,
        revenueSharePercentage: data.communityShare,
      },
      ctx.userId as string
    );
    revalidatePath("/platform/communities");
    return { ok: true, data: { communityId: community.id, slug: community.slug } };
  } catch (err) {
    return serializeError(err);
  }
}