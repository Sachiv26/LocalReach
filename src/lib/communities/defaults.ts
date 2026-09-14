/** The initial public categories requested for the Umgeni Park pilot community. */
export function defaultCategories(communityId: string) {
  const categories = [
    { name: "For Sale", icon: "tag", sortOrder: 1 },
    { name: "Services", icon: "wrench", sortOrder: 2 },
    { name: "Property", icon: "home", sortOrder: 3 },
    { name: "Vehicles", icon: "car", sortOrder: 4 },
    { name: "Jobs", icon: "briefcase", sortOrder: 5 },
    { name: "Food & Takeaways", icon: "utensils", sortOrder: 6 },
    { name: "Restaurants", icon: "coffee", sortOrder: 7 },
    { name: "Supermarkets", icon: "shopping-basket", sortOrder: 8 },
    { name: "Kids & Family", icon: "baby", sortOrder: 9 },
    { name: "Home & Garden", icon: "flower", sortOrder: 10 },
    { name: "Electronics", icon: "smartphone", sortOrder: 11 },
    { name: "Fashion", icon: "shirt", sortOrder: 12 },
    { name: "Beauty", icon: "sparkles", sortOrder: 13 },
    { name: "Professional Services", icon: "scale", sortOrder: 14 },
    { name: "Classes & Lessons", icon: "graduation-cap", sortOrder: 15 },
    { name: "Local Businesses", icon: "store", sortOrder: 16 },
    { name: "Community", icon: "users", sortOrder: 17 },
    { name: "Other", icon: "package", sortOrder: 18 },
  ];
  return categories.map((c) => ({
    communityId,
    name: c.name,
    slug: c.name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    icon: c.icon,
    sortOrder: c.sortOrder,
  }));
}

/** Demo pricing plans (fully configurable per community). */
export function defaultPlans(communityId: string) {
  return [
    {
      communityId,
      planKey: "FREE" as const,
      name: "Free Advert",
      description: "Basic listing within the community free quota.",
      price: 0,
      billingPeriod: "ONE_TIME" as const,
      features: [
        "2 free adverts per week",
        "Up to 2 photos",
        "Appears in community listings",
      ],
    },
    {
      communityId,
      planKey: "BOOST" as const,
      name: "Boost",
      description: "Featured placement with priority in listings.",
      price: 39,
      billingPeriod: "ONE_TIME" as const,
      boostDurationDays: 7,
      features: [
        "Featured placement for 7 days",
        "Highlighted listing card",
        "Priority in listings",
        "WhatsApp-ready promotional format",
      ],
    },
    {
      communityId,
      planKey: "PREMIUM" as const,
      name: "Premium Advert",
      description: "Maximum visibility for your advert.",
      price: 79,
      billingPeriod: "ONE_TIME" as const,
      boostDurationDays: 30,
      extraImages: 2,
      features: [
        "Featured placement for 30 days",
        "More prominent card",
        "Extended duration",
        "Extra images where permitted",
      ],
    },
    {
      communityId,
      planKey: "BUSINESS_MONTHLY" as const,
      name: "Business Monthly",
      description: "Full business profile and featured placement.",
      price: 299,
      billingPeriod: "MONTHLY" as const,
      features: [
        "Business profile in directory",
        "Multiple active adverts",
        "Featured business placement",
        "Daily specials",
        "Analytics dashboard",
        "WhatsApp & website CTAs",
      ],
    },
    {
      communityId,
      planKey: "BUSINESS_ANNUAL" as const,
      name: "Business Annual",
      description: "Everything in Business Monthly, billed yearly.",
      price: 2990,
      billingPeriod: "YEARLY" as const,
      features: [
        "12 months for the price of 10",
        "All Business Monthly features",
        "Priority support",
      ],
    },
    {
      communityId,
      planKey: "VERIFIED_BUSINESS" as const,
      name: "Verified Business",
      description: "Business details verified by LocalReach badge.",
      price: 199,
      billingPeriod: "YEARLY" as const,
      features: [
        "“Business details verified by LocalReach” badge",
        "Annual re-verification",
      ],
    },
  ];
}
