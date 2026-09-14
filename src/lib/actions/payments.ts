"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { AppError, serializeError } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth/access";
import { startCheckout } from "@/lib/payments/service";
import type { ActionResult } from "@/lib/actions/auth";

const startBoostSchema = z.object({
  advertId: z.string().uuid(),
  planKey: z.enum(["BOOST", "PREMIUM"]),
  communityId: z.string().uuid(),
});

export async function startBoostCheckoutAction(
  input: unknown
): Promise<ActionResult<{ checkoutUrl: string }>> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    const data = startBoostSchema.parse(input);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { session } = await startCheckout({
      userId: ctx.userId,
      communityId: data.communityId,
      itemType: "ADVERT_BOOST",
      planKey: data.planKey,
      advertId: data.advertId,
      origin,
    });
    revalidatePath("/dashboard/payments");
    return { ok: true, data: { checkoutUrl: session.checkoutUrl } };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input." };
    return serializeError(err);
  }
}

const subscribeSchema = z.object({
  businessId: z.string().uuid(),
  communityId: z.string().uuid(),
  planKey: z.enum(["BUSINESS_MONTHLY", "BUSINESS_ANNUAL"]),
  months: z.number().int().min(1).max(12).optional(),
});

export async function startBusinessSubscriptionAction(
  input: unknown
): Promise<ActionResult<{ checkoutUrl: string }>> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    const data = subscribeSchema.parse(input);
    const business = await prisma.businessProfile.findUnique({
      where: { id: data.businessId },
    });
    if (!business || business.ownerId !== ctx.userId) {
      throw new AppError("FORBIDDEN", "You can only subscribe your own business.");
    }
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { session } = await startCheckout({
      userId: ctx.userId,
      communityId: data.communityId,
      itemType: "BUSINESS_SUBSCRIPTION",
      planKey: data.planKey,
      businessId: data.businessId,
      months: data.months ?? (data.planKey === "BUSINESS_ANNUAL" ? 12 : 1),
      origin,
    });
    return { ok: true, data: { checkoutUrl: session.checkoutUrl } };
  } catch (err) {
    return serializeError(err);
  }
}