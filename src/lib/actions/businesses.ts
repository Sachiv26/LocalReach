"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { AppError, serializeError } from "@/lib/errors";
import { getAuthContext, requireCommunityAdmin, requirePermission } from "@/lib/auth/access";
import { PERMISSIONS } from "@/lib/permissions";
import {
  createBusinessProfile,
  updateBusinessProfile,
  setBusinessVerification,
} from "@/lib/businesses/service";
import { businessProfileSchema, businessSpecialSchema } from "@/lib/ads/validation";
import type { ActionResult } from "@/lib/actions/auth";

export async function createBusinessAction(
  communityId: string,
  input: unknown
): Promise<ActionResult<{ businessId: string; slug: string }>> {
  try {
    const ctx = await requirePermission(PERMISSIONS.CREATE_BUSINESS_PROFILE, communityId);
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    const data = businessProfileSchema.parse(input);
    const business = await createBusinessProfile(ctx.userId, communityId, data);
    revalidatePath("/dashboard/business");
    return { ok: true, data: { businessId: business.id, slug: business.slug } };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, message: err.issues[0]?.message ?? "Please check the form.", code: "VALIDATION" };
    }
    return serializeError(err);
  }
}

export async function updateBusinessAction(
  businessId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    const data = businessProfileSchema.partial().parse(input);
    await updateBusinessProfile(ctx.userId, businessId, data);
    revalidatePath(`/businesses/${businessId}`);
    revalidatePath("/dashboard/business");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Please check the form.", code: "VALIDATION" };
    return serializeError(err);
  }
}

export async function createSpecialAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    const data = businessSpecialSchema.parse(input);
    const business = await prisma.businessProfile.findUnique({ where: { id: data.businessId } });
    if (!business || business.ownerId !== ctx.userId) {
      throw new AppError("FORBIDDEN", "You can only add specials to your own business.");
    }
    await prisma.businessSpecial.create({
      data: {
        businessId: data.businessId,
        communityId,
        title: data.title,
        description: data.description,
        priceNote: data.priceNote,
        images: data.images,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.startDate <= new Date() ? "ACTIVE" : "SCHEDULED",
      },
    });
    revalidatePath("/dashboard/business");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Please check the form.", code: "VALIDATION" };
    return serializeError(err);
  }
}

const verifySchema = z.object({
  businessId: z.string().uuid(),
  status: z.enum(["VERIFIED", "REJECTED", "EXPIRED", "PENDING", "NOT_VERIFIED"]),
  checks: z.record(z.boolean()).optional(),
});

export async function verifyBusinessAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = verifySchema.parse(input);
    await setBusinessVerification(data.businessId, ctx.userId as string, data.status, data.checks ?? {});
    revalidatePath("/admin/businesses");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}