"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/ads/validation";
import { AppError, serializeError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { sendTemplatedEmail } from "@/lib/email/service";
import { logger } from "@/lib/logger";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined
      ? { data?: undefined }
      : { data: T }))
  | { ok: false; message: string; code?: string; details?: unknown };

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  try {
    const ip = await clientIp();
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      throw new AppError("RATE_LIMITED", "Too many attempts. Please try again later.");
    }
    const data = registerSchema.parse(input);
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new AppError("CONFLICT", "An account with this email already exists.");
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        marketingOptIn: data.marketingOptIn ?? false,
        roles: { create: [{ role: "USER" }] },
      },
    });
    await sendTemplatedEmail({
      to: user.email,
      template: "WELCOME",
      variables: {
        title: `Welcome to LocalReach, ${user.name ?? "there"}!`,
        body: "Your account is ready. Post your first free advert or explore local businesses in your community.",
      },
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        message: err.issues[0]?.message ?? "Please check the form.",
        code: "VALIDATION",
      };
    }
    return serializeError(err);
  }
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const ip = await clientIp();
    const rl = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) throw new AppError("RATE_LIMITED", "Too many attempts. Try again later.");
    const data = forgotPasswordSchema.parse(input);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendTemplatedEmail({
        to: user.email,
        template: "PASSWORD_RESET",
        subject: "Reset your LocalReach password",
        variables: {
          title: "Reset your password",
          body: `Open this link to choose a new password (valid for 1 hour):\n${appUrl}/reset-password?token=${token}`,
        },
      });
      logger.info("Password reset requested", { userId: user.id });
    }
    // Always report success — never reveal whether the account exists.
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, message: err.issues[0]?.message ?? "Invalid input." };
    }
    return serializeError(err);
  }
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const ip = await clientIp();
    const rl = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.ok) throw new AppError("RATE_LIMITED", "Too many attempts.");
    const data = resetPasswordSchema.parse(input);
    const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError("VALIDATION", "This reset link is invalid or has expired.");
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, message: err.issues[0]?.message ?? "Invalid input." };
    }
    return serializeError(err);
  }
}
