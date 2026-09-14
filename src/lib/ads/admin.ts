import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit/service";
import { notify } from "@/lib/notifications/service";

export type ModerationDecisionInput = {
  advertId: string;
  adminId: string;
  action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "FLAG";
  reason?: string;
  notes?: string;
};

/** Admin moderation decision — the ONLY path for approving/rejecting adverts. */
export async function moderateAdvert(input: ModerationDecisionInput): Promise<void> {
  const advert = await prisma.advert.findUnique({
    where: { id: input.advertId },
    include: { community: true },
  });
  if (!advert) throw new AppError("NOT_FOUND", "Advert not found.");

  const now = new Date();
  if (input.action === "APPROVE") {
    const expiresAt = new Date(
      now.getTime() + advert.community.maxAdDurationDays * 24 * 60 * 60 * 1000
    );
    await prisma.$transaction([
      prisma.advert.update({
        where: { id: advert.id },
        data: {
          status: "PUBLISHED",
          moderationStatus: "APPROVED",
          publishedAt: advert.publishedAt ?? now,
          expiresAt: advert.expiresAt ?? expiresAt,
          reviewedById: input.adminId,
          reviewedAt: now,
          moderationReasons: [],
        },
      }),
      prisma.moderationAction.create({
        data: {
          actorId: input.adminId,
          communityId: advert.communityId,
          advertId: advert.id,
          action: "AD_APPROVED",
          notes: input.notes,
        },
      }),
    ]);
    await notify({
      userId: advert.advertiserId,
      type: "AD_APPROVED",
      title: "Advert approved",
      body: `Your advert “${advert.title}” is now live.`,
      data: { advertId: advert.id, slug: advert.slug },
      email: true,
    });
    await recordAudit({
      actorId: input.adminId,
      communityId: advert.communityId,
      action: "AD_APPROVED",
      entityType: "Advert",
      entityId: advert.id,
      oldValues: { status: advert.status },
      newValues: { status: "PUBLISHED" },
    });
    return;
  }

  if (input.action === "REJECT" || input.action === "REQUEST_CHANGES") {
    if (!input.reason && !input.notes) {
      throw new AppError("VALIDATION", "A reason is required when rejecting.");
    }
    await prisma.$transaction([
      prisma.advert.update({
        where: { id: advert.id },
        data: {
          status: input.action === "REJECT" ? "REJECTED" : "DRAFT",
          moderationStatus:
            input.action === "REJECT" ? "REJECTED" : "CHANGES_REQUESTED",
          reviewedById: input.adminId,
          reviewedAt: now,
          moderationReasons: [
            input.reason ?? "Changes requested",
            ...(input.notes ? [input.notes] : []),
          ],
        },
      }),
      prisma.moderationAction.create({
        data: {
          actorId: input.adminId,
          communityId: advert.communityId,
          advertId: advert.id,
          action: input.action === "REJECT" ? "AD_REJECTED" : "CHANGES_REQUESTED",
          reason: input.reason,
          notes: input.notes,
        },
      }),
    ]);
    await notify({
      userId: advert.advertiserId,
      type: "AD_REJECTED",
      title: input.action === "REJECT" ? "Advert rejected" : "Changes requested",
      body: `“${advert.title}”: ${input.reason ?? ""}${input.notes ? ` — ${input.notes}` : ""}`,
      data: { advertId: advert.id },
      email: true,
    });
    await recordAudit({
      actorId: input.adminId,
      communityId: advert.communityId,
      action: input.action === "REJECT" ? "AD_REJECTED" : "ADVERT_EDITED",
      entityType: "Advert",
      entityId: advert.id,
      oldValues: { status: advert.status },
      newValues: {
        status: input.action === "REJECT" ? "REJECTED" : "DRAFT",
        reason: input.reason,
      },
    });
    return;
  }

  // FLAG — keeps the advert in the review queue but surfaces the concern
  await prisma.moderationAction.create({
    data: {
      actorId: input.adminId,
      communityId: advert.communityId,
      advertId: advert.id,
      action: "AD_FLAGGED",
      reason: input.reason,
      notes: input.notes,
    },
  });
  await recordAudit({
    actorId: input.adminId,
    communityId: advert.communityId,
    action: "AD_FLAGGED",
    entityType: "Advert",
    entityId: advert.id,
    newValues: { reason: input.reason, notes: input.notes },
  });
}

/** Removes an advert (soft delete) — e.g. from a validated report. */
export async function removeAdvert(
  advertId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const advert = await prisma.advert.findUnique({ where: { id: advertId } });
  if (!advert) throw new AppError("NOT_FOUND", "Advert not found.");
  await prisma.$transaction([
    prisma.advert.update({
      where: { id: advertId },
      data: { deletedAt: new Date(), status: "SUSPENDED" },
    }),
    prisma.moderationAction.create({
      data: {
        actorId: adminId,
        communityId: advert.communityId,
        advertId,
        action: "ADVERT_REMOVED",
        reason,
      },
    }),
  ]);
  await recordAudit({
    actorId: adminId,
    communityId: advert.communityId,
    action: "ADVERT_REMOVED",
    entityType: "Advert",
    entityId: advertId,
    newValues: { reason },
  });
}

/** Activates a paid boost on an advert (called from the payment pipeline only). */
export async function activateBoost(
  advertId: string,
  planKey: "BOOST" | "PREMIUM",
  days: number
): Promise<void> {
  const now = new Date();
  const featuredUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const advert = await prisma.advert.findUnique({ where: { id: advertId } });
  if (!advert) throw new AppError("NOT_FOUND", "Advert not found.");

  await prisma.advert.update({
    where: { id: advertId },
    data: {
      isFeatured: true,
      featuredUntil,
      activeBoostKey: planKey,
      expiresAt:
        advert.expiresAt && advert.expiresAt > featuredUntil
          ? advert.expiresAt
          : featuredUntil,
    },
  });
  await notify({
    userId: advert.advertiserId,
    type: "BOOST_ACTIVATED",
    title: "Boost activated",
    body: `Your advert “${advert.title}” is now featured until ${featuredUntil.toLocaleDateString("en-ZA")}.`,
    data: { advertId, planKey },
    email: true,
  });
}
