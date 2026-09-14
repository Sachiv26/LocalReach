import type { NotificationType } from "@prisma/client";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendTemplatedEmail } from "@/lib/email/service";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: boolean;
};

/**
 * Creates an in-app notification and (optionally) an email via the email
 * abstraction. Email failures never break the primary flow.
 */
export async function notify(input: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: "IN_APP",
        title: input.title,
        body: input.body,
                        data: (input.data as any) ?? undefined,
      },
    });
  } catch (err) {
    logger.error("Failed to create in-app notification", {
      err: String(err),
      type: input.type,
    });
  }

  if (input.email) {
    try {
      await sendTemplatedEmail({
        to: null, // resolved below
        userId: input.userId,
        subject: input.title,
        template: input.type,
        variables: { title: input.title, body: input.body },
      });
    } catch (err) {
      logger.warn("Email notification skipped", { err: String(err) });
    }
  }
}

export async function notifyMany(inputs: NotifyInput[]) {
  await Promise.allSettled(inputs.map(notify));
}

export async function listNotifications(userId: string, page = 1, pageSize = 20) {
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, total, unread, page, pageSize };
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  await prisma.notification.updateMany({
    where: { userId, ...(ids && ids.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
}
