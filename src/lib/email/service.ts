/**
 * Email abstraction. Uses Resend when RESEND_API_KEY is configured; otherwise
 * logs emails to the console (development/mock adapter). Swap providers by
 * extending this module — call sites are unaffected.
 */

import { logger } from "@/lib/logger";
import prisma from "@/lib/db";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type EmailTemplate =
  | "WELCOME"
  | "AD_APPROVED"
  | "AD_REJECTED"
  | "AD_EXPIRING"
  | "AD_EXPIRED"
  | "QUOTA_WARNING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "BOOST_ACTIVATED"
  | "BUSINESS_VERIFIED"
  | "MODERATION_WARNING"
  | "ADVERT_SUBMITTED"
  | "PASSWORD_RESET"
  | string; // NotificationType values pass through

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f7f8f7;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <div style="color:#158258;font-weight:700;font-size:18px;margin-bottom:16px">LocalReach</div>
    <h1 style="font-size:20px;color:#0e4431;margin:0 0 12px">${title}</h1>
    <div style="color:#374151;font-size:14px;line-height:1.6">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
    <p style="color:#6b7280;font-size:12px;margin:0">
      LocalReach is a marketplace platform and does not guarantee sellers, buyers,
      products or transactions. Always perform your own due diligence.
    </p>
  </div></body></html>`;
}

function bodyHtml(variables: Record<string, string | undefined>): string {
  const body = variables.body ?? "";
  return `<p>${body.replace(/\n/g, "</p><p>")}</p>`;
}

const SUBJECTS: Record<string, string> = {
  WELCOME: "Welcome to LocalReach",
  AD_APPROVED: "Your advert has been approved",
  AD_REJECTED: "Your advert needs changes",
  AD_EXPIRING: "Your advert is expiring soon",
  AD_EXPIRED: "Your advert has expired",
  QUOTA_WARNING: "Free advert quota used",
  PAYMENT_SUCCESS: "Payment successful",
  PAYMENT_FAILED: "Payment failed",
  BOOST_ACTIVATED: "Your boost is live",
  BUSINESS_VERIFIED: "Business verification update",
  MODERATION_WARNING: "Community guidelines warning",
  ADVERT_SUBMITTED: "Advert submitted for review",
  PASSWORD_RESET: "Reset your password",
};

function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string | undefined>
): { subject: string; html: string } {
  const fallback = template.replaceAll("_", " ").toLowerCase();
  const title = variables.title ?? SUBJECTS[template] ?? fallback;
  return { subject: title, html: wrapHtml(title, bodyHtml(variables)) };
}

/** Console mock adapter used when RESEND_API_KEY is not configured. */
async function sendViaConsole(message: EmailMessage) {
  logger.info("EMAIL (mock)", {
    to: message.to,
    subject: message.subject,
  });
}

async function sendViaResend(message: EmailMessage) {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const configured = Boolean(process.env.RESEND_API_KEY);
  try {
    if (configured) await sendViaResend(message);
    else await sendViaConsole(message);
  } catch (err) {
    logger.error("Email send failed", { err: String(err), to: message.to });
    throw err;
  }
}

/**
 * Renders a template and sends to a user's email address.
 * Pass `to` directly, or `userId` to resolve the address (and honour
 * marketing consent for non-transactional mail at the call site).
 */
export async function sendTemplatedEmail(opts: {
  to: string | null;
  userId?: string | null;
  subject?: string;
  template: EmailTemplate;
  variables?: Record<string, string | undefined>;
}): Promise<{ delivered: boolean; to: string | null }> {
  let to = opts.to;
  if (!to && opts.userId) {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: { email: true },
    });
    to = user?.email ?? null;
  }
  if (!to) return { delivered: false, to: null };

  const rendered = renderTemplate(opts.template, opts.variables ?? {});
  await sendEmail({
    to,
    subject: opts.subject ?? rendered.subject,
    html: rendered.html,
  });
  return { delivered: true, to };
}

