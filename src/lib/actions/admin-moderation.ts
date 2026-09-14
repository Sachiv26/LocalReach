"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db";
import { AppError, serializeError } from "@/lib/errors";
import { requireCommunityAdmin } from "@/lib/auth/access";
import { moderateAdvert, removeAdvert } from "@/lib/ads/admin";
import { suspendUser } from "@/lib/moderation/strikes";
import { recordAudit } from "@/lib/audit/service";
import { sendTemplatedEmail } from "@/lib/email/service";
import type { ActionResult } from "@/lib/actions/auth";

const MODERATION_SCHEMA = z.object({
  advertId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "FLAG"]),
  reason: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function moderateAdvertAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = MODERATION_SCHEMA.parse(input);
    await moderateAdvert({
      advertId: data.advertId,
      adminId: ctx.userId as string,
      action: data.action,
      reason: data.reason,
      notes: data.notes,
    });
    revalidatePath("/admin/ads");
    revalidatePath(`/admin/ads/${data.advertId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError)
      return { ok: false, message: "Invalid input.", code: "VALIDATION" };
    return serializeError(err);
  }
}

const reportSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum([
    "DISMISS",
    "REMOVE_AD",
    "SUSPEND_ADVERTISER",
    "CONTACT_ADVERTISER",
    "REVIEWED",
  ]),
  notes: z.string().trim().max(500).optional(),
});

async function resolveReport(
  adminId: string,
  reportId: string,
  action: "DISMISS" | "REMOVE_AD" | "SUSPEND_ADVERTISER" | "CONTACT_ADVERTISER" | "REVIEWED",
  notes?: string
) {
  await prisma.advertReport.update({
    where: { id: reportId },
    data: {
      status: action === "DISMISS" ? "DISMISSED" : "ACTION_TAKEN",
      resolvedById: adminId,
      resolvedAt: new Date(),
    },
  });
  await recordAudit({
    actorId: adminId,
    action: "REPORT_RESOLVED",
    entityType: "AdvertReport",
    entityId: reportId,
    newValues: { action, notes },
  });
}

export async function resolveReportAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = reportSchema.parse(input);
    const report = await prisma.advertReport.findUnique({
      where: { id: data.reportId },
      include: {
        advert: { select: { advertiserId: true, title: true, id: true } },
      },
    });
    if (!report) throw new AppError("NOT_FOUND", "Report not found.");

    if (data.action === "REMOVE_AD") {
      await removeAdvert(
        report.advertId,
        ctx.userId as string,
        data.notes ?? "Removed via report"
      );
      await resolveReport(ctx.userId as string, report.id, data.action, data.notes);
    } else if (data.action === "SUSPEND_ADVERTISER" && report.advert) {
      await suspendUser(
        report.advert.advertiserId,
        ctx.userId as string,
        communityId,
        data.notes ?? "Repeated prohibited content",
        "RESTRICT"
      );
      await resolveReport(ctx.userId as string, report.id, data.action, data.notes);
    } else if (data.action === "CONTACT_ADVERTISER" && report.advert) {
      const advertiser = await prisma.user.findUnique({
        where: { id: report.advert.advertiserId },
      });
      if (advertiser?.email) {
        await sendTemplatedEmail({
          to: advertiser.email,
          template: "MODERATION_WARNING",
          subject: "Your advert was reported",
          variables: {
            title: "Your advert was reported",
            body: `Your advert “${report.advert.title}” was reported. Please review it: ${data.notes ?? ""}`,
          },
        });
      }
      await resolveReport(ctx.userId as string, report.id, data.action, data.notes);
    } else {
      await resolveReport(ctx.userId as string, report.id, data.action, data.notes);
    }
    revalidatePath("/admin/reports");
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, message: "Invalid input." };
    return serializeError(err);
  }
}

const suspendSchema = z.object({
  targetUserId: z.string().uuid(),
  mode: z.enum(["RESTRICT", "SUSPEND", "BAN", "UNRESTRICT"]),
  reason: z.string().trim().min(3).max(500),
});

export async function suspendUserAction(
  communityId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const ctx = await requireCommunityAdmin(communityId);
    const data = suspendSchema.parse(input);
    await suspendUser(
      data.targetUserId,
      ctx.userId as string,
      communityId,
      data.reason,
      data.mode
    );
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return serializeError(err);
  }
}