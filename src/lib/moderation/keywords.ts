/**
 * Content-safety keyword catalogues for automated moderation.
 *
 * Keyword matching alone is NEVER the final authority — matches feed the
 * moderation pipeline which combines rules, URL detection, content checks and
 * (optionally) an external moderation API. Admins can always override.
 */

export type ContentCheck = {
  reason: string;
  weight: number; // added to risk score
  severity: "BLOCK" | "REVIEW";
};

type Category = {
  id: string;
  label: string;
  patterns: RegExp[];
  weight: number;
  severity: "BLOCK" | "REVIEW";
};

const CATEGORIES: Category[] = [
  {
    id: "firearms_weapons",
    label: "Firearms or weapons",
    weight: 90,
    severity: "BLOCK",
    patterns: [
      /\bfire\s?arm/i, /\bgun(s)?\b/i, /\brifle\b/i, /\bshotgun\b/i,
      /\bpistol\b/i, /\brevolver\b/i, /\bammo\b/i, /\bammunition\b/i,
      /\b9mm\b/i, /\btaser\b/i, /\bstun gun\b/i, /\bcrossbow\b/i,
      /\bpepper spray\b/i, /\bknife for sale/i, /\bswitchblade\b/i,
      /\bflick knife\b/i, /\bbow and arrow\b/i, /\bgun licence\b/i,
      /\blicenced firearm\b/i,
    ],
  },
  {
    id: "adult_content",
    label: "Adult or explicit content",
    weight: 90,
    severity: "BLOCK",
    patterns: [
      /\bporn/i, /\bxxx\b/i, /\bnudes?\b/i, /\berotic\b/i, /\bescort(s)?\b/i,
      /\badult services?\b/i, /\bsex (work|chat|service)/i, /\bhappy ending\b/i,
      /\bonlyfans\b/i, /\bsugar (daddy|baby)\b/i, /\bhookup\b/i, /\bnaked\b/i,
      /\bstripper\b/i, /\bbrothel\b/i,
    ],
  },
  {
    id: "live_pets",
    label: "Live animal sales",
    weight: 70,
    severity: "BLOCK",
    patterns: [
      /\bpuppies? for sale\b/i, /\bkittens? for sale\b/i,
      /\blive (pet|animal)s?\b/i, /\bpuppies? available\b/i,
      /\bsnake for sale\b/i, /\bparrot(s)? for sale\b/i,
    ],
  },
  {
    id: "hate_speech",
    label: "Hate speech, racism or sexism",
    weight: 95,
    severity: "BLOCK",
    patterns: [
      /\bk[ae]?ff[ae]r/i, /\bhotnot\b/i, /\bcooler?ie\b/i, /\bcoon\b/i,
      /\bkill the boer\b/i, /\bshoot the boer\b/i, /\bwhites only\b/i,
      /\bblacks only\b/i, /\bgo back to your (own )?country\b/i,
      /\bn[i1]gg/i, /\bf[a4]gg?[o0]t/i, /\btr[ae]nn[iy]e\b/i,
      /\bwomen (are|should) (know their place|belong)/i,
    ],
  },
  {
    id: "politics",
    label: "Political content",
    weight: 45,
    severity: "REVIEW",
    patterns: [
      /\bvote (for|anc|da|eff)\b/i, /\bpolitical (party|rally|campaign)\b/i,
      /\belection(s)?\b/i, /\bmanifesto\b/i, /\bcampaign (launch|trail)\b/i,
      /\bpresidential\b/i, /\bparliament\b/i, /\bmalema\b/i, /\bramaphosa\b/i,
      /\bzuma\b/i, /\bland expropriation\b/i, /\brun for (council|mayor)\b/i,
    ],
  },
  {
    id: "swearing",
    label: "Profanity",
    weight: 40,
    severity: "REVIEW",
    patterns: [
      /\bf[u\*]+ck/i, /\bsh[i\*]t\b/i, /\bb[i\*]+tch/i, /\bbastard/i,
      /\bwanker/i, /\bc[u\*]nt/i, /\bdickhead/i, /\ba[s\*]{2}hole/i,
      /\bpoes\b/i, /\bbliksem\b/i, /\bmoer\b/i,
    ],
  },
  {
    id: "external_platform",
    label: "External platform promotion",
    weight: 55,
    severity: "REVIEW",
    patterns: [
      /\bjoin (our|my|the) whatsapp group\b/i, /\bwhatsapp group link\b/i,
      /\btelegram (group|channel)\b/i, /\bfacebook (group|marketplace|page)\b/i,
      /\bgumtree\b/i, /\bbob ?shop\b/i, /\bbidorbuy\b/i, /\bofferup\b/i,
      /\bcraigslist\b/i, /\blinkedin\b/i, /\binstagram page\b/i,
      /\bfollow (us|me) on\b/i, /\bsubscribe to (my|our) (channel|page)\b/i,
      /\byoutube (channel|link)\b/i, /\bvisit (our|my) (website|site) at\b/i,
    ],
  },
  {
    id: "scam_language",
    label: "Possible scam language",
    weight: 60,
    severity: "REVIEW",
    patterns: [
      /\bget rich quick\b/i, /\bguaranteed (income|profit|returns?)\b/i,
      /\bmake money fast\b/i, /\binvestment opportunity\b/i, /\bforex signals?\b/i,
      /\bbinary options?\b/i, /\bcrypto (profit|signals|doubl)/i,
      /\bdouble your money\b/i, /\bno credit check\b/i, /\burgent loan\b/i,
      /\bblacklisted loans?\b/i, /\bwork from home.{0,30}earn r?\d/i,
      /\bno experience (needed|required).{0,30}earn/i,
      /\bsms (me |your )?(your )?bank(ing)? details\b/i,
      /\bsend (money|deposit) (first|upfront)\b/i, /\blucky (draw|winner)\b/i,
      /\byou have won\b/i, /\bclaim your (prize|winnings)\b/i, /\bfree money\b/i,
    ],
  },
];

/** WhatsApp group link detection — always flagged for review. */
export const WHATSAPP_GROUP_LINK =
  /chat\.whatsapp\.com|whatsapp\.com\/invite|wa\.me\/invite/i;

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/gi);
    return matches ? Array.from(new Set(matches)) : [];
}

export type ContentCheckResult = {
  decision: "SAFE" | "REVIEW" | "BLOCK";
  riskScore: number;
  reasons: string[];
  matchedChecks: string[];
};

/**
 * Pure content checks over the advert text. Combines keyword categories,
 * URL detection and WhatsApp-group-link detection.
 */
export function runContentChecks(text: string): ContentCheckResult {
  const reasons: string[] = [];
  const matchedChecks: string[] = [];
  let riskScore = 0;
  let blocked = false;
  let review = false;

  const haystack = text || "";
  const urls = extractUrls(haystack);

  for (const category of CATEGORIES) {
    const hit = category.patterns.some((p) => p.test(haystack));
    if (hit) {
      reasons.push(category.label);
      matchedChecks.push(category.id);
      riskScore = Math.max(riskScore, category.weight);
      if (category.severity === "BLOCK") blocked = true;
      else review = true;
    }
  }

  // URLs in general are reviewed (community rule: no external links)
  if (urls.length > 0 && !review && !blocked) {
    reasons.push("Contains external links");
    matchedChecks.push("external_links");
    riskScore = Math.max(riskScore, 30);
    review = true;
  }

  const decision = blocked ? "BLOCK" : review ? "REVIEW" : "SAFE";
  return {
    decision,
    riskScore: Math.min(100, riskScore),
    reasons,
    matchedChecks,
  };
}
