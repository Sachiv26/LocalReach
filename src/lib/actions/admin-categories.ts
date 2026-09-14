"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { serializeError } from "@/lib/errors";
import { requireCommunityAdmin } from "@/lib/auth/access";
import { recordAudit } from "@/lib/audit/service";
import type { ActionResult } from "@/lib/actions/auth";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().max(40).optional(),
  isProhibited: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export async function createCategoryAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = categorySchema.parse(input);
    const slug = data.name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await prisma.category.create({
      data: {
        communityId,
        name: data.name,
        slug,
        icon: data.icon,
        sortOrder: data.sortOrder ?? 99,
        isProhibited: data.isProhibited ?? false,
      },
    });
    await recordAudit({
      actorId: ctx.userId,
      communityId,
      action: "CATEGORY_CHANGED",
      entityType: "Category",
      newValues: { name: data.name },
    });
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input." };
    return serializeError(err);
  }
}

export async function updateCategoryAction(
  communityId: string,
  categoryId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = categorySchema.parse(input);
    await prisma.category.update({ where: { id: categoryId }, data });
    await recordAudit({
      actorId: ctx.userId,
      communityId,
      action: "CATEGORY_CHANGED",
      entityType: "Category",
      entityId: categoryId,
      newValues: data as any,
    });
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}