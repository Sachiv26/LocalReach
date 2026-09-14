import { describe, it, expect } from "vitest";
import {
  evaluateRules,
  severityToDecision,
  mergeDecisions,
  worstDecision,
  riskFromViolations,
  matchesTerm,
  type RuleContext,
} from "@/lib/rules/engine";
import type { RuleLike } from "@/lib/rules/engine";

const baseContext: RuleContext = {
  now: new Date("2026-01-15T10:00:00"),
  currentHour: 10,
  imagesCount: 1,
  text: "Gently used sofa for sale in Umgeni Park",
  categorySlug: "for-sale",
  categoryNames: ["For Sale"],
  urls: [],
  userAgeDays: 30,
  quotaUsed: 0,
  advertDurationDays: 14,
  isBusinessSpecial: false,
};

describe("severityToDecision", () => {
  it("maps CRITICAL/HIGH to BLOCK", () => {
    expect(severityToDecision("CRITICAL")).toBe("BLOCK");
    expect(severityToDecision("HIGH")).toBe("BLOCK");
  });
  it("maps MEDIUM to REVIEW", () => {
    expect(severityToDecision("MEDIUM")).toBe("REVIEW");
  });
  it("maps LOW/INFO to ALLOW", () => {
    expect(severityToDecision("LOW")).toBe("ALLOW");
    expect(severityToDecision("INFO")).toBe("ALLOW");
  });
});

describe("mergeDecisions", () => {
  it("picks the stronger decision", () => {
    expect(mergeDecisions("BLOCK", "ALLOW")).toBe("BLOCK");
    expect(mergeDecisions("ALLOW", "REVIEW")).toBe("REVIEW");
    expect(mergeDecisions("ALLOW", "ALLOW")).toBe("ALLOW");
  });
});

describe("worstDecision", () => {
  it("returns ALLOW for empty array", () => {
    expect(worstDecision([])).toBe("ALLOW");
  });
  it("returns the worst from a list", () => {
    expect(worstDecision([
      { ruleId: "1", ruleName: "a", type: "MAX_IMAGES", severity: "LOW", message: "", decision: "ALLOW" },
      { ruleId: "2", ruleName: "b", type: "PROHIBITED_KEYWORDS", severity: "CRITICAL", message: "", decision: "BLOCK" },
    ])).toBe("BLOCK");
  });
});

describe("riskFromViolations", () => {
  it("returns the highest severity score", () => {
    const violations = [
      { ruleId: "1", ruleName: "a", type: "MAX_IMAGES" as const, severity: "LOW" as const, message: "", decision: "ALLOW" as const },
      { ruleId: "2", ruleName: "b", type: "PROHIBITED_KEYWORDS" as const, severity: "CRITICAL" as const, message: "", decision: "BLOCK" as const },
    ];
    expect(riskFromViolations(violations)).toBe(95);
  });
  it("returns 0 for no violations", () => {
    expect(riskFromViolations([])).toBe(0);
  });
});

describe("matchesTerm", () => {
  it("matches whole words", () => {
    expect(matchesTerm("Gently used sofa for sale", "sofa")).toBe(true);
  });
  it("does not match partial words", () => {
    expect(matchesTerm("Gently used sofa for sale", "sof")).toBe(false);
  });
});

describe("evaluateRules", () => {
  it("passes when all rules pass", () => {
    const rule: RuleLike = {
      id: "max-images",
      name: "Max 2 images",
      type: "MAX_IMAGES",
      enabled: true,
      severity: "HIGH",
      configuration: { max: 2 },
    };
    const violations = evaluateRules([rule], { ...baseContext, imagesCount: 1 });
    expect(violations).toHaveLength(0);
  });

  it("flags exceeding image limit", () => {
    const rule: RuleLike = {
      id: "max-images",
      name: "Max 2 images",
      type: "MAX_IMAGES",
      enabled: true,
      severity: "HIGH",
      configuration: { max: 2 },
    };
    const violations = evaluateRules([rule], { ...baseContext, imagesCount: 3 });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.decision).toBe("BLOCK");
  });

  it("flags prohibited keywords", () => {
    const rule: RuleLike = {
      id: "prohibited-keywords",
      name: "Prohibited keywords",
      type: "PROHIBITED_KEYWORDS",
      enabled: true,
      severity: "CRITICAL",
      configuration: { keywords: ["firearm", "weapon"] },
    };
    const violations = evaluateRules([rule], { ...baseContext, text: "Brand new firearm for sale" });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.decision).toBe("BLOCK");
  });

  it("flags external WhatsApp group links", () => {
    const rule: RuleLike = {
      id: "no-whatsapp-links",
      name: "No WhatsApp group links",
      type: "PROHIBITED_LINKS",
      enabled: true,
      severity: "CRITICAL",
      configuration: { blockWhatsAppGroupLinks: true },
    };
    const violations = evaluateRules([rule], { ...baseContext, urls: ["https://chat.whatsapp.com/abc123"] });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.decision).toBe("BLOCK");
  });

  it("skips disabled rules", () => {
    const rule: RuleLike = {
      id: "disabled",
      name: "Disabled rule",
      type: "MAX_IMAGES",
      enabled: false,
      severity: "HIGH",
      configuration: { max: 0 },
    };
    const violations = evaluateRules([rule], { ...baseContext, imagesCount: 99 });
    expect(violations).toHaveLength(0);
  });
});

describe("POSTING_HOURS rule (quiet hours)", () => {
  it("never flags when configuration is unrestricted (0/0 — the default)", () => {
    const rule: RuleLike = {
      id: "hours",
      name: "Posting hours",
      type: "POSTING_HOURS",
      enabled: true,
      severity: "MEDIUM",
      configuration: { startHour: 0, endHour: 0 },
    };
    for (const hour of [0, 3, 10, 22, 23]) {
      const violations = evaluateRules([rule], { ...baseContext, currentHour: hour });
      expect(violations).toHaveLength(0);
    }
  });

  it("flags submissions during quiet hours only if an admin explicitly re-enables them", () => {
    const rule: RuleLike = {
      id: "hours",
      name: "Posting hours",
      type: "POSTING_HOURS",
      enabled: true,
      severity: "MEDIUM",
      configuration: { startHour: 6, endHour: 20 },
    };
    expect(evaluateRules([rule], { ...baseContext, currentHour: 22 })).toHaveLength(1);
    expect(evaluateRules([rule], { ...baseContext, currentHour: 4 })).toHaveLength(1);
    expect(evaluateRules([rule], { ...baseContext, currentHour: 10 })).toHaveLength(0);
  });

  it("does not flag when the posting-hours rule is disabled", () => {
    const rule: RuleLike = {
      id: "hours-off",
      name: "Posting hours",
      type: "POSTING_HOURS",
      enabled: false,
      severity: "MEDIUM",
      configuration: { startHour: 6, endHour: 20 },
    };
    expect(evaluateRules([rule], { ...baseContext, currentHour: 23 })).toHaveLength(0);
  });
});
