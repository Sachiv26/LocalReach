"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { AppError, serializeError } from "@/lib/errors";
import { getAuthContext } from "@/lib/auth/access";
import type { ActionResult } from "@/lib/actions/auth";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(20).optional().or(z.literal("")),
  marketingOptIn: z.boolean(),
});

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    const data = settingsSchema.parse(input);
    await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        name: data.name,
        phone: data.phone || null,
        whatsappNumber: data.whatsappNumber || null,
        marketingOptIn: data.marketingOptIn,
      },
    });
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, message: err.issues[0]?.message ?? "Invalid input." };
    }
    return serializeError(err);
  }
}

const deleteAccountSchema = z.object({ confirm: z.literal("DELETE") });

/** Privacy: account deletion (soft delete + anonymisation). */
export async function requestAccountDeletionAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    deleteAccountSchema.parse(input);
    await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        deletedAt: new Date(),
        email: `deleted-${ctx.userId.slice(0, 8)}@deleted.localreach`,
        name: "Deleted user",
        phone: null,
        whatsappNumber: null,
        passwordHash: null,
      },
    });
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}

/** Marks all notifications read. */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in.");
    await prisma.notification.updateMany({
      where: { userId: ctx.userId, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/dashboard/notifications");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}
