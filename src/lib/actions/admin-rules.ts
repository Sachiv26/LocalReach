"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { serializeError } from "@/lib/errors";
import { requireCommunityAdmin } from "@/lib/auth/access";
import { recordAudit } from "@/lib/audit/service";
import { sendTemplatedEmail } from "@/lib/email/service";
import type { ActionResult } from "@/lib/actions/auth";
import type { Prisma } from "@prisma/client";

const RULE_TYPES = [
  "POSTING_HOURS",
  "MAX_WEEKLY_ADS",
  "MAX_IMAGES",
  "PROHIBITED_KEYWORDS",
  "PROHIBITED_CATEGORIES",
  "PROHIBITED_LINKS",
  "REQUIRES_APPROVAL",
  "MINIMUM_USER_AGE",
  "MAX_AD_DURATION",
] as const;

const ruleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  type: z.enum(RULE_TYPES),
  severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  enabled: z.boolean().optional(),
  configuration: z.record(z.unknown()).optional(),
});

export async function upsertRuleAction(
  communityId: string,
  ruleId: string | null,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = ruleSchema.parse(input);
    const updateData: Prisma.CommunityRuleUpdateInput = {
      name: data.name,
      description: data.description,
      type: data.type,
      severity: data.severity,
      enabled: data.enabled ?? true,
      configuration: data.configuration as Prisma.InputJsonValue,
    };
    if (ruleId) {
      await prisma.communityRule.update({ where: { id: ruleId }, data: updateData });
      await recordAudit({
        actorId: ctx.userId,
        communityId,
        action: "RULE_CHANGED",
        entityType: "CommunityRule",
        entityId: ruleId,
        newValues: updateData as any,
      });
    } else {
      await prisma.communityRule.create({
        data: {
          communityId,
          name: data.name,
          description: data.description,
          type: data.type,
          severity: data.severity,
          enabled: data.enabled ?? true,
          configuration: data.configuration as Prisma.InputJsonValue,
        },
      });
      await recordAudit({
        actorId: ctx.userId,
        communityId,
        action: "RULE_CREATED",
        entityType: "CommunityRule",
        newValues: { name: data.name, type: data.type },
      });
    }
    revalidatePath("/admin/rules");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input." };
    return serializeError(err);
  }
}

export async function deleteRuleAction(
  communityId: string,
  ruleId: string
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    await prisma.communityRule.delete({ where: { id: ruleId } });
    await recordAudit({
      actorId: ctx.userId,
      communityId,
      action: "RULE_DELETED",
      entityType: "CommunityRule",
      entityId: ruleId,
    });
    revalidatePath("/admin/rules");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}