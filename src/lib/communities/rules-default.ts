/**
 * Seed rules matching the established WhatsApp-group rules of the pilot
 * community (Umgeni Park / Durban North). All rules are editable by admins
 * through the rule editor.
 */
export function defaultRules(communityId: string) {
  return [
    {
      communityId,
      name: "Maximum 2 free adverts per 7 days",
      description: "Free advertising quota per advertiser per rolling 7-day period.",
      type: "MAX_WEEKLY_ADS" as const,
      severity: "HIGH" as const,
      configuration: { max: 2, periodDays: 7 },
    },
    {
      communityId,
      name: "Maximum 2 photos per advert",
      description:
        "Multiple products must be combined into one collage/catalogue and count as one post.",
      type: "MAX_IMAGES" as const,
      severity: "MEDIUM" as const,
      configuration: { max: 2 },
    },
    {
      communityId,
      name: "No live pet sales",
      description: "No live animal sales in the community.",
      type: "PROHIBITED_KEYWORDS" as const,
      severity: "CRITICAL" as const,
      configuration: {
        keywords: ["puppy for sale", "kitten for sale", "puppies for sale", "live pets"],
      },
    },
    {
      communityId,
      name: "No firearms or weapons",
      description: "Firearms, ammunition and weapons are prohibited.",
      type: "PROHIBITED_KEYWORDS" as const,
      severity: "CRITICAL" as const,
      configuration: {
        keywords: ["firearm", "gun for sale", "rifle", "shotgun", "pistol", "ammunition", "ammo", "taser", "crossbow"],
      },
    },
    {
      communityId,
      name: "No racism, sexism or hate speech",
      description: "Racist, sexist or hateful content is prohibited.",
      type: "PROHIBITED_KEYWORDS" as const,
      severity: "CRITICAL" as const,
      configuration: {
        keywords: ["whites only", "blacks only", "kill the boer", "go back to your country"],
      },
    },
    {
      communityId,
      name: "No politics",
      description: "Political campaigning and political content is prohibited.",
      type: "PROHIBITED_KEYWORDS" as const,
      severity: "HIGH" as const,
      configuration: {
        keywords: ["vote anc", "vote da", "vote eff", "political rally", "election campaign"],
      },
    },
    {
      communityId,
      name: "No swearing",
      description: "Keep the community friendly — no profanity.",
      type: "PROHIBITED_KEYWORDS" as const,
      severity: "MEDIUM" as const,
      configuration: {
        keywords: ["fuck", "shit", "bitch", "bastard", "wanker", "poes", "bliksem"],
      },
    },
    {
      communityId,
      name: "No pornography or explicit content",
      description: "Pornographic or explicit material is prohibited.",
      type: "PROHIBITED_KEYWORDS" as const,
      severity: "CRITICAL" as const,
      configuration: {
        keywords: ["porn", "escort", "adult services", "nudes", "xxx", "onlyfans"],
      },
    },
    {
      communityId,
      name: "No external platform promotion or WhatsApp group links",
      description:
        "No referrals, promotions or links to other WhatsApp groups or platforms.",
      type: "PROHIBITED_LINKS" as const,
      severity: "HIGH" as const,
      configuration: {
        blockWhatsAppLinks: true,
        platforms: ["gumtree", "facebook marketplace", "telegram group", "facebook group", "bidorbuy", "bob shop"],
      },
    },
    {
      communityId,
      name: "Adverts require admin approval",
      description: "All adverts are reviewed by a community admin before going live.",
      type: "REQUIRES_APPROVAL" as const,
      severity: "INFO" as const,
      configuration: { enabled: true },
    },
    {
      communityId,
      name: "Maximum advert duration 30 days",
      description: "Adverts automatically expire after 30 days.",
      type: "MAX_AD_DURATION" as const,
      severity: "LOW" as const,
      configuration: { maxDays: 30 },
    },
  ];
}
