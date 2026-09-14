import type { RuleContext, RuleLike, RuleViolation } from "./engine";
import {
  asRecord,
  makeViolation,
  matchesTerm,
  ruleBool,
  ruleNum,
  ruleStrArray,
} from "./engine";

/** Per-type rule evaluators. Each returns a violation or null. */
export function evaluateRuleType(
  rule: RuleLike,
  context: RuleContext
): RuleViolation | null {
  const config = asRecord(rule.configuration);
  const {
    currentHour,
    imagesCount,
    text,
    categorySlug,
    urls,
    userAgeDays,
    quotaUsed,
    advertDurationDays,
    isBusinessSpecial,
  } = context;

  switch (rule.type) {
    case "POSTING_HOURS": {
      if (isBusinessSpecial) break;
      const startHour = ruleNum(config, "startHour", 6);
      const endHour = ruleNum(config, "endHour", 20);
      const allowed =
        startHour < endHour
          ? currentHour >= startHour && currentHour < endHour
          : currentHour >= startHour || currentHour < endHour;
      if (!allowed) {
        return makeViolation(
          rule,
          `Adverts may not be submitted between ${String(endHour).padStart(2, "0")}:00 and ${String(startHour).padStart(2, "0")}:00 (quiet hours).`
        );
      }
      break;
    }
    case "MAX_WEEKLY_ADS": {
      const max = ruleNum(config, "max", 2);
      if (quotaUsed >= max) {
        return makeViolation(
          rule,
          `You have reached the limit of ${max} free adverts for this period.`
        );
      }
      break;
    }
    case "MAX_IMAGES": {
      const max = ruleNum(config, "max", 2);
      if (imagesCount > max) {
        return makeViolation(
          rule,
          `Maximum ${max} photo${max === 1 ? "" : "s"} per advert — combine multiple products into one collage.`
        );
      }
      break;
    }
    case "PROHIBITED_KEYWORDS": {
      const keywords = ruleStrArray(config, "keywords");
      const haystack = text.toLowerCase();
      const matched = keywords.filter((k) => matchesTerm(haystack, k));
      if (matched.length > 0) {
        return makeViolation(
          rule,
          `Prohibited content detected: ${matched.slice(0, 3).join(", ")}${matched.length > 3 ? "…" : ""}.`
        );
      }
      break;
    }
    case "PROHIBITED_CATEGORIES": {
      const prohibited = ruleStrArray(config, "categorySlugs");
      if (prohibited.includes(categorySlug)) {
        return makeViolation(
          rule,
          "The selected category is not allowed in this community."
        );
      }
      break;
    }
    case "PROHIBITED_LINKS": {
      const blockWhatsApp = ruleBool(config, "blockWhatsAppLinks", true);
      const platforms = ruleStrArray(config, "platforms");
      const waLink =
        /wa\.me|chat\.whatsapp\.com|api\.whatsapp\.com|whatsapp\.com\/invite/i;
      if (
        blockWhatsApp &&
        (waLink.test(text) || urls.some((u) => waLink.test(u)))
      ) {
        return makeViolation(rule, "Links to WhatsApp groups are not allowed.");
      }
      const platformHits = platforms.filter((p) => matchesTerm(text, p));
      if (platformHits.length > 0) {
        return makeViolation(
          rule,
          `Promoting other platforms is not allowed: ${platformHits.slice(0, 3).join(", ")}.`
        );
      }
      break;
    }
    case "MINIMUM_USER_AGE": {
      const days = ruleNum(config, "days", 0);
      if (days > 0 && userAgeDays < days) {
        return makeViolation(
          rule,
          `Your account must be at least ${days} day(s) old before advertising.`
        );
      }
      break;
    }
    case "MAX_AD_DURATION": {
      const maxDays = ruleNum(config, "maxDays", 30);
      if (advertDurationDays > maxDays) {
        return makeViolation(
          rule,
          `Adverts may run for a maximum of ${maxDays} days.`
        );
      }
      break;
    }
    case "REQUIRES_APPROVAL":
      break; // informs the pipeline; not a violation
    default:
      break;
  }
  return null;
}

