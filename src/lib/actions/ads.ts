"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  createAdvertSchema,
  reportAdvertSchema,
  moderationDecisionSchema,
} from "@/lib/ads/validation";
import { submitAdvert } from "@/lib/ads/service";
import { AppError, serializeError } from "@/lib/errors";
import { getAuthContext, requirePermission } from "@/lib/auth/access";
import { PERMISSIONS } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { recordInteraction } from "@/lib/ads/service";
import { notify } from "@/lib/notifications/service";
import type { ActionResult } from "@/lib/actions/auth";
import { clientIp } from "@/lib/actions/auth";

type AdvertResult = ActionResult<{
  advertId: string;
  slug: string;
  status: string;
  moderation?: { decision: string; riskScore: number; reasons: string[] } | null;
}>;

export async function createAdvertAction(
  input: unknown
): Promise<AdvertResult> {
  try {
    const ctx = await requirePermission(PERMISSIONS.CREATE_AD);
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");

    const ip = await clientIp();
    const rl = rateLimit(`create-ad:${ctx.userId}`, 10, 60 * 60 * 1000);
    if (!rl.ok) throw new AppError("RATE_LIMITED", "Please slow down and try again in a minute.");

    const data = createAdvertSchema.parse(input);
    // Members become advertisers on their first submission.
    await prisma.userRole.upsert({
      where: { userId_role: { userId: ctx.userId, role: "ADVERTISER" } },
      create: { userId: ctx.userId, role: "ADVERTISER" },
      update: {},
    });
    const outcome = await submitAdvert(data, ctx.userId);
    revalidatePath(`/community/${data.communityId}`);
    revalidatePath("/ads");
    return {
      ok: true,
      data: {
        advertId: outcome.advert.id,
        slug: outcome.advert.slug,
        status: outcome.status,
        moderation: outcome.moderation,
      },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        message: err.issues[0]?.message ?? "Please check the form.",
        code: "VALIDATION",
      };
    }
    return serializeError(err);
  }
}

const toggleSaveSchema = z.object({
  advertId: z.string().uuid(),
  notifyOnExpiry: z.boolean().optional().default(true),
});

export async function toggleSaveAdvertAction(
  input: unknown
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in to save adverts.");
    const data = toggleSaveSchema.parse(input);
    const existing = await prisma.savedAdvert.findUnique({
      where: { userId_advertId: { userId: ctx.userId, advertId: data.advertId } },
    });
    if (existing) {
      await prisma.savedAdvert.delete({ where: { userId_advertId: { userId: ctx.userId, advertId: data.advertId } } });
      return { ok: true, data: { saved: false } };
    }
    await prisma.savedAdvert.create({
      data: {
        userId: ctx.userId,
        advertId: data.advertId,
        notifyOnExpiry: data.notifyOnExpiry,
      },
    });
    return { ok: true, data: { saved: true } };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input.", code: "VALIDATION" };
    return serializeError(err);
  }
}

export async function reportAdvertAction(input: unknown): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in to report adverts.");
    const ip = await clientIp();
    const rl = rateLimit(`report:${ip}`, 20, 60 * 60 * 1000);
    if (!rl.ok) throw new AppError("RATE_LIMITED", "Too many reports. Please try again later.");
    const data = reportAdvertSchema.parse(input);
    const advert = await prisma.advert.findUnique({
      where: { id: data.advertId },
      select: { communityId: true },
    });
    if (!advert) throw new AppError("NOT_FOUND", "Advert not found.");
    const existingOpen = await prisma.advertReport.findFirst({
      where: { advertId: data.advertId, reporterId: ctx.userId, status: "OPEN" },
    });
    if (existingOpen) {
      return { ok: true }; // dedupe repeated reports
    }
    await prisma.advertReport.create({
      data: {
        advertId: data.advertId,
        communityId: advert.communityId,
        reporterId: ctx.userId,
        reason: data.reason,
        details: data.details,
      },
    });
    await recordInteraction(data.advertId, "REPORT", ctx.userId);
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, message: err.issues[0]?.message ?? "Invalid input.", code: "VALIDATION" };
    }
    return serializeError(err);
  }
}

const interactionSchema = z.object({
  advertId: z.string().uuid(),
  type: z.enum(["VIEW", "WHATSAPP_CLICK", "PHONE_CLICK", "WEBSITE_CLICK", "SHARE"]),
});

/** Called client-side (fire-and-forget) to record privacy-conscious analytics. */
export async function recordInteractionAction(input: unknown): Promise<ActionResult> {
  try {
    const data = interactionSchema.parse(input);
    const ctx = await getAuthContext();
    await recordInteraction(data.advertId, data.type, ctx.userId);
    return { ok: true };
  } catch {
    return { ok: true }; // analytics is best-effort
  }
}