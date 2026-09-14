/**
 * Automated moderation pipeline.
 *
 *   Advert submitted
 *     → Rule engine
 *     → Automated content checks
 *     → Risk score
 *     → (optional) External moderation API
 *     → Decision: SAFE | REVIEW | BLOCK
 *
 * Automated decisions are never final: anything not SAFE goes to the admin
 * moderation queue, and admins can always override any decision.
 */

import type { AutomatedDecision } from "@prisma/client";
import {
  evaluateRules,
  riskFromViolations,
  worstDecision,
  type RuleContext,
  type RuleLike,
  type RuleViolation,
} from "@/lib/rules/engine";
import { runContentChecks } from "@/lib/moderation/keywords";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export { runContentChecks, extractUrls } from "@/lib/moderation/keywords";

export type ModerationInput = {
  title: string;
  description: string;
  categorySlug: string;
  categoryNames: string[];
  imagesCount: number;
  rules: RuleLike[];
  communityTimezone: string;
  userAgeDays: number;
  quotaUsed: number;
  advertDurationDays: number;
  isBusinessSpecial?: boolean;
};

export type ModerationResult = {
  decision: AutomatedDecision;
  riskScore: number;
  reasons: string[];
  ruleViolations: RuleViolation[];
  externalChecks: boolean;
};

function toAutomatedDecision(
  d: "SAFE" | "REVIEW" | "BLOCK"
): AutomatedDecision {
  return d;
}

/**
 * Optional external moderation API hook. When MODERATION_API_KEY and
 * MODERATION_API_URL are configured, advert text is submitted for a second
 * opinion. Failures degrade gracefully — the pipeline continues with local
 * results. Returns null when not configured or on error.
 */
async function externalModeration(
  text: string
): Promise<{ decision: "SAFE" | "REVIEW" | "BLOCK"; score: number; reasons: string[] } | null> {
  if (!env.moderationApiEnabled) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(env.MODERATION_API_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.MODERATION_API_KEY}`,
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      decision?: string;
      score?: number;
      reasons?: string[];
    };
    const decision =
      data.decision === "BLOCK" || data.decision === "REVIEW"
        ? data.decision
        : "SAFE";
    return {
      decision,
      score: typeof data.score === "number" ? data.score : 0,
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
    };
  } catch (err) {
    logger.warn("External moderation API failed", { error: String(err) });
    return null;
  }
}

export async function runModeration(
  input: ModerationInput
): Promise<ModerationResult> {
  const text = `${input.title}\n${input.description}`;

  // 1. Rule engine (community-configurable rules)
  const currentHour = getLocalHourFor(input.communityTimezone);
  const ruleContext: RuleContext = {
    now: new Date(),
    currentHour,
    imagesCount: input.imagesCount,
    text,
    categorySlug: input.categorySlug,
    categoryNames: input.categoryNames,
    urls: [],
    userAgeDays: input.userAgeDays,
    quotaUsed: input.quotaUsed,
    advertDurationDays: input.advertDurationDays,
    isBusinessSpecial: input.isBusinessSpecial ?? false,
  };
  const ruleViolations = evaluateRules(input.rules, ruleContext);

  // 2. Automated content checks (keywords, URLs, scam language)
  const content = runContentChecks(text);

  // 3. Optional external moderation API
  const external = await externalModeration(text);

  // Combine
  const reasons = [
    ...ruleViolations.filter((v) => v.decision !== "ALLOW").map((v) => v.message),
    ...content.reasons,
    ...(external?.reasons ?? []),
  ];

  const localScore = Math.max(
    riskFromViolations(ruleViolations),
    content.riskScore
  );
  const riskScore = Math.max(localScore, external?.score ?? 0);

  const ruleDecision = worstDecision(ruleViolations);
  let decision: "SAFE" | "REVIEW" | "BLOCK" =
    ruleDecision === "BLOCK"
      ? "BLOCK"
      : ruleDecision === "REVIEW" || content.decision !== "SAFE"
        ? "REVIEW"
        : "SAFE";
  if (external) {
    decision =
      decision === "BLOCK" || external.decision === "BLOCK"
        ? "BLOCK"
        : decision === "REVIEW" || external.decision === "REVIEW"
          ? "REVIEW"
          : "SAFE";
  }

  return {
    decision: toAutomatedDecision(decision),
    riskScore,
    reasons: Array.from(new Set(reasons)),
    ruleViolations,
    externalChecks: external !== null,
  };
}

function getLocalHourFor(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: timezone,
    }).formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === "hour");
    const hour = hourPart ? Number(hourPart.value) : NaN;
    return Number.isFinite(hour) ? hour : new Date().getUTCHours();
  } catch {
    return new Date().getUTCHours();
  }
}
