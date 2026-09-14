"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { serializeError } from "@/lib/errors";
import { requireCommunityAdmin } from "@/lib/auth/access";
import { recordAudit } from "@/lib/audit/service";
import { sendTemplatedEmail } from "@/lib/email/service";
import type { ActionResult } from "@/lib/actions/auth";

const planSchema = z.object({
  planKey: z.enum([
    "FREE",
    "BOOST",
    "PREMIUM",
    "BUSINESS_MONTHLY",
    "BUSINESS_ANNUAL",
    "VERIFIED_BUSINESS",
  ]),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  price: z.number().min(0).max(999999),
  billingPeriod: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]),
  features: z.array(z.string()).max(12),
  isActive: z.boolean().optional(),
  boostDurationDays: z.number().int().min(1).max(365).optional().nullable(),
  extraImages: z.number().int().min(0).max(10).optional().nullable(),
});

export async function upsertPricingPlanAction(
  communityId: string,
  planId: string | null,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = planSchema.parse(input);
    const payload = {
      planKey: data.planKey,
      name: data.name,
      description: data.description,
      price: data.price,
      billingPeriod: data.billingPeriod,
      features: data.features,
      isActive: data.isActive ?? true,
      boostDurationDays: data.boostDurationDays ?? null,
      extraImages: data.extraImages ?? null,
    };
    if (planId) {
      await prisma.pricingPlan.update({ where: { id: planId }, data: payload });
      await recordAudit({
        actorId: ctx.userId,
        communityId,
        action: "PRICE_CHANGED",
        entityType: "PricingPlan",
        entityId: planId,
        newValues: payload as any,
      });
    } else {
      await prisma.pricingPlan.create({ data: { communityId, ...payload } });
      await recordAudit({
        actorId: ctx.userId,
        communityId,
        action: "PRICE_CHANGED",
        entityType: "PricingPlan",
        newValues: payload as any,
      });
    }
    revalidatePath("/admin/pricing");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input." };
    return serializeError(err);
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["COMMUNITY_ADMIN", "MODERATOR"]),
});

export async function inviteAdminAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = inviteSchema.parse(input);
    const { randomBytes } = await import("node:crypto");
    const token = randomBytes(24).toString("hex");
    await prisma.invitation.create({
      data: {
        communityId,
        email: data.email.toLowerCase(),
        role: data.role,
        token,
        invitedById: ctx.userId as string,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    await recordAudit({
      actorId: ctx.userId,
      communityId,
      action: "ADMIN_INVITED",
      entityType: "Invitation",
      newValues: { email: data.email, role: data.role },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendTemplatedEmail({
      to: data.email,
      template: "WELCOME",
      subject: "You've been invited to help run a LocalReach community",
      variables: {
        title: "Community admin invitation",
        body: `You've been invited to join the community team.\nAccept: ${appUrl}/accept-invitation?token=${token}`,
      },
    });
    revalidatePath("/admin/team");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}