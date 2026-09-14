import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "AD_APPROVED"
  | "AD_REJECTED"
  | "AD_FLAGGED"
  | "ADVERT_EDITED"
  | "ADVERT_REMOVED"
  | "USER_SUSPENDED"
  | "USER_BANNED"
  | "USER_WARNED"
  | "USER_UNRESTRICTED"
  | "RULE_CHANGED"
  | "RULE_CREATED"
  | "RULE_DELETED"
  | "PRICE_CHANGED"
  | "COMMUNITY_UPDATED"
  | "COMMUNITY_CREATED"
  | "CATEGORY_CHANGED"
  | "PAYOUT_APPROVED"
  | "PAYOUT_MARKED_PAID"
  | "PAYMENT_RECORDED"
  | "REPORT_RESOLVED"
  | "ADMIN_INVITED"
  | "BUSINESS_VERIFIED"
  | "BUSINESS_UNVERIFIED";

type AuditEntry = {
  actorId: string | null;
  communityId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

/**
 * Records a sensitive action for audit purposes. Audit writes must never
 * throw into the primary flow — failures are logged.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        communityId: entry.communityId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        oldValues: entry.oldValues ?? undefined,
        newValues: entry.newValues ?? undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error("Audit log write failed", {
      err: String(err),
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    });
  }
}

export async function listAuditLogs(
  filters: { communityId?: string; actorId?: string },
  page = 1,
  pageSize = 20
) {
  const where = {
    ...(filters.communityId ? { communityId: filters.communityId } : {}),
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { name: true, email: true } },
        community: { select: { name: true, slug: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
