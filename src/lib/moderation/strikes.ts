import prisma from "@/lib/db";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit/service";
import { notify } from "@/lib/notifications/service";

export type StrikeSeverityInput =
  | "WARNING"
  | "TEMPORARY_RESTRICTION"
  | "SUSPENSION"
  | "BAN";

/**
 * Configurable moderation policy: applies strikes according to the
 * community's configured thresholds (1st violation: warning, 2nd: restriction,
 * 3rd: suspension...). Admins can force a severity explicitly to override.
 */
export async function applyStrike(opts: {
  userId: string;
  issuedById: string;
  communityId: string;
  severity?: StrikeSeverityInput;
  reason: string;
}): Promise<StrikeSeverityInput> {
  const community = await prisma.community.findUnique({
    where: { id: opts.communityId },
  });
  if (!community) throw new AppError("NOT_FOUND", "Community not found.");

  const strikeCount = await prisma.userStrike.count({
    where: {
      userId: opts.userId,
      communityId: opts.communityId,
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });

  const count = strikeCount + 1;
  let severity: StrikeSeverityInput = opts.severity ?? "WARNING";
  if (!opts.severity) {
    if (community.banAfter > 0 && count >= community.banAfter) severity = "BAN";
    else if (community.suspendAfter > 0 && count >= community.suspendAfter)
      severity = "SUSPENSION";
    else if (community.restrictAfter > 0 && count >= community.restrictAfter)
      severity = "TEMPORARY_RESTRICTION";
    else severity = "WARNING";
  }

  const restrictionDays = severity === "TEMPORARY_RESTRICTION" ? 7 : 30;

  await prisma.userStrike.create({
    data: {
      userId: opts.userId,
      issuedById: opts.issuedById,
      communityId: opts.communityId,
      severity,
      reason: opts.reason,
      expiresAt:
        severity === "TEMPORARY_RESTRICTION" || severity === "SUSPENSION"
          ? new Date(Date.now() + restrictionDays * 24 * 60 * 60 * 1000)
          : null,
    },
  });

  if (severity === "TEMPORARY_RESTRICTION") {
    await prisma.user.update({
      where: { id: opts.userId },
      data: { suspendedUntil: new Date(Date.now() + restrictionDays * 24 * 60 * 60 * 1000) },
    });
  } else if (severity === "SUSPENSION") {
    await prisma.user.update({
      where: { id: opts.userId },
      data: { suspendedUntil: new Date(Date.now() + restrictionDays * 24 * 60 * 60 * 1000) },
    });
  } else if (severity === "BAN") {
    await prisma.user.update({
      where: { id: opts.userId },
      data: { bannedAt: new Date() },
    });
  }

  await notify({
    userId: opts.userId,
    type: "MODERATION_WARNING",
    title:
      severity === "WARNING"
        ? "Community guidelines warning"
        : "Moderation action taken",
    body: opts.reason,
    data: { communityId: opts.communityId, severity },
    email: true,
  });

  await recordAudit({
    actorId: opts.issuedById,
    communityId: opts.communityId,
    action:
      severity === "BAN"
        ? "USER_BANNED"
        : severity === "WARNING"
          ? "USER_WARNED"
          : "USER_SUSPENDED",
    entityType: "User",
    entityId: opts.userId,
    newValues: { severity, reason: opts.reason },
  });

  return severity;
}

export async function suspendUser(
  targetUserId: string,
  adminId: string,
  communityId: string,
  reason: string,
  mode: "RESTRICT" | "SUSPEND" | "BAN" | "UNRESTRICT"
): Promise<void> {
  if (mode === "UNRESTRICT") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { suspendedUntil: null, bannedAt: null },
    });
    await prisma.moderationAction.create({
      data: {
        actorId: adminId,
        communityId,
        targetUserId,
        action: "USER_UNRESTRICTED",
        notes: reason,
      },
    });
    await recordAudit({
      actorId: adminId,
      communityId,
      action: "USER_UNRESTRICTED",
      entityType: "User",
      entityId: targetUserId,
    });
    return;
  }
  await applyStrike({
    userId: targetUserId,
    issuedById: adminId,
    communityId,
    severity:
      mode === "BAN" ? "BAN" : mode === "SUSPEND" ? "SUSPENSION" : "TEMPORARY_RESTRICTION",
    reason,
  });
}
