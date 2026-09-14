/**
 * Rule engine — database-driven community rules (evaluators in evaluators.ts).
 */

import type { RuleSeverity, RuleType } from "@prisma/client";

export type RuleLike = {
  id: string;
  name: string;
  type: RuleType;
  enabled: boolean;
  severity: RuleSeverity;
  configuration: unknown;
};

export type RuleContext = {
  now: Date;
  currentHour: number; // community-local hour
  imagesCount: number;
  text: string; // title + description combined
  categorySlug: string;
  categoryNames: string[];
  urls: string[];
  userAgeDays: number;
  quotaUsed: number;
  advertDurationDays: number;
  isBusinessSpecial: boolean;
};

export type RuleDecision = "ALLOW" | "REVIEW" | "BLOCK";

export type RuleViolation = {
  ruleId: string;
  ruleName: string;
  type: RuleType;
  severity: RuleSeverity;
  message: string;
  decision: RuleDecision;
};

export function severityToDecision(severity: RuleSeverity): RuleDecision {
  if (severity === "CRITICAL" || severity === "HIGH") return "BLOCK";
  if (severity === "MEDIUM") return "REVIEW";
  return "ALLOW";
}

const DECISION_ORDER: Record<RuleDecision, number> = {
  ALLOW: 0,
  REVIEW: 1,
  BLOCK: 2,
};

export function mergeDecisions(a: RuleDecision, b: RuleDecision): RuleDecision {
  return DECISION_ORDER[a] >= DECISION_ORDER[b] ? a : b;
}

export function asRecord(config: unknown): Record<string, unknown> {
  return typeof config === "object" && config !== null
    ? (config as Record<string, unknown>)
    : {};
}

export function ruleNum(config: Record<string, unknown>, key: string, fallback: number) {
  const v = config[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function ruleStrArray(config: Record<string, unknown>, key: string): string[] {
  const v = config[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function ruleBool(config: Record<string, unknown>, key: string, fallback: boolean) {
  const v = config[key];
  return typeof v === "boolean" ? v : fallback;
}

export function escapeRegex(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesTerm(haystack: string, term: string): boolean {
  const t = term.toLowerCase().trim();
  if (!t) return false;
  try {
    return new RegExp(`\\b${escapeRegex(t)}\\b`, "i").test(haystack);
  } catch {
    return haystack.includes(t);
  }
}

export function makeViolation(
  rule: RuleLike,
  message: string,
  decision?: RuleDecision
): RuleViolation {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    type: rule.type,
    severity: rule.severity,
    message,
    decision: decision ?? severityToDecision(rule.severity),
  };
}

export function evaluateRules(
  rules: RuleLike[],
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const v = evaluateRule(rule, context);
    if (v) violations.push(v);
  }
  return violations;
}

export function evaluateRule(
  rule: RuleLike,
  context: RuleContext
): RuleViolation | null {
  // Delegate to per-type evaluator
  return evaluateRuleType(rule, context);
}

export function worstDecision(violations: RuleViolation[]): RuleDecision {
  return violations.reduce<RuleDecision>(
    (worst, v) => mergeDecisions(worst, v.decision),
    "ALLOW"
  );
}

export function riskFromViolations(violations: RuleViolation[]): number {
  const weights: Record<RuleSeverity, number> = {
    INFO: 5,
    LOW: 15,
    MEDIUM: 35,
    HIGH: 70,
    CRITICAL: 95,
  };
  return violations.reduce((score, v) => Math.max(score, weights[v.severity] ?? 30), 0);
}

import { evaluateRuleType } from "./evaluators";
