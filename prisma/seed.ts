/**
 * LocalReach seed script.
 *
 * Seeds: super admin, the demo community ("Umgeni Park & Durban North"),
 * categories, rules matching the community's WhatsApp-group rules, pricing
 * plans, demo users, businesses and adverts.
 *
 * All values are DEMO defaults and fully configurable at runtime.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultCategories, defaultPlans } from "../src/lib/communities/defaults";
import { defaultRules } from "../src/lib/communities/rules-default";
import {
  PERMISSIONS,
  PERMISSION_KEYS,
  ROLE_PERMISSIONS,
  ROLES,
  ROLE_LABELS,
  type Role,
} from "../src/lib/permissions";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? "admin@localreach.test").toLowerCase();
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "Admin123!";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: "Platform owner with full access",
  PLATFORM_MODERATOR: "Moderates across all communities",
  COMMUNITY_OWNER: "Owns a community tenant",
  COMMUNITY_ADMIN: "Manages a community day-to-day",
  MODERATOR: "Reviews and moderates adverts",
  BUSINESS_OWNER: "Runs a verified business profile",
  ADVERTISER: "Posts adverts in communities",
  USER: "Base member",
};

async function seedPermissions() {
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, description: key.replaceAll("_", " ") },
      update: {},
    });
  }
  for (const role of ROLES) {
    for (const permissionKey of ROLE_PERMISSIONS[role]) {
      await prisma.rolePermission.upsert({
        where: { roleName_permissionKey: { roleName: role, permissionKey } },
        create: { roleName: role, permissionKey },
        update: {},
      });
    }
  }
}

async function seedSuperAdmin() {
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: "LocalReach Admin",
      passwordHash,
      emailVerified: new Date(),
      roles: { create: [{ role: "SUPER_ADMIN" }] },
    },
    update: {},
  });
  return user;
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);
  const mk = async (email: string, name: string, roles: Role[]) => {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        emailVerified: new Date(),
        phone: "0821234567",
        whatsappNumber: "0821234567",
        roles: { create: roles.map((role) => ({ role })) },
      },
      update: {},
    });
    return user;
  };
  return {
    owner: await mk("owner@localreach.test", "Sarah (Community Admin)", [
      "COMMUNITY_OWNER",
      "ADVERTISER",
    ]),
    moderator: await mk("moderator@localreach.test", "Thabo (Moderator)", ["MODERATOR"]),
    advertiser1: await mk("thandi@example.com", "Thandi Mkhize", ["ADVERTISER"]),
    advertiser2: await mk("john@example.com", "John Botha", ["ADVERTISER"]),
    businessOwner: await mk("cornercafe@example.com", "Lerato (Corner Café)", [
      "BUSINESS_OWNER",
      "ADVERTISER",
    ]),
  };
}

async function seedCommunity(ownerId: string) {
  const community = await prisma.community.upsert({
    where: { slug: "umgeni-park-durban-north" },
    create: {
      name: "Umgeni Park & Durban North",
      slug: "umgeni-park-durban-north",
      description:
        "The trusted local marketplace for Umgeni Park and Durban North residents. Buy, sell and support local businesses in your neighbourhood — working alongside our community WhatsApp groups.",
      tagline: "Your neighbourhood. Your marketplace.",
      suburb: "Umgeni Park",
      city: "Durban",
      province: "KwaZulu-Natal",
      timezone: "Africa/Johannesburg",
      status: "PILOT",
      pilotStart: new Date(),
      whatsappInviteUrl: "https://chat.whatsapp.com/DEMO-INVITE-REPLACE-ME",
      whatsappCommunityName: "Umgeni Park Ads",
      footerText: "Umgeni Park & Durban North — powered by LocalReach",
    },
    update: {},
  });

  await prisma.communityAdmin.upsert({
    where: { userId_communityId: { userId: ownerId, communityId: community.id } },
    create: { userId: ownerId, communityId: community.id, role: "COMMUNITY_OWNER" },
    update: {},
  });
  await prisma.communityMember.upsert({
    where: { userId_communityId: { userId: ownerId, communityId: community.id } },
    create: { userId: ownerId, communityId: community.id },
    update: {},
  });

  // Categories — keyed by slug
  const categoryData = defaultCategories(community.id);
  for (const c of categoryData) {
    await prisma.category.upsert({
      where: { communityId_slug: { communityId: community.id, slug: c.slug } },
      create: c,
      update: {},
    });
  }
  // Rules
  const ruleCount = await prisma.communityRule.count({
    where: { communityId: community.id },
  });
  if (ruleCount === 0) {
    await prisma.communityRule.createMany({ data: defaultRules(community.id) });
  }
  // Pricing plans
  for (const plan of defaultPlans(community.id)) {
    await prisma.pricingPlan.upsert({
      where: {
        communityId_planKey: {
          communityId: community.id,
          planKey: plan.planKey,
        },
      },
      create: plan,
      update: {},
    });
  }
  // Revenue share 70/30
  const shareExists = await prisma.revenueShareRule.findFirst({
    where: { communityId: community.id },
  });
  if (!shareExists) {
    await prisma.revenueShareRule.create({
      data: {
        communityId: community.id,
        platformPercentage: 70,
        communityPercentage: 30,
      },
    });
  }
  // WhatsApp templates
  const templates = [
    {
      templateKey: "SHORT",
      name: "Short WhatsApp advert",
      body: "📢 LOCAL AD\n\n{{title}}\n\n💰 {{price}}\n\n📍 {{location}}\n\n📞 WhatsApp Seller\n\n👉 View full details:\n{{url}}\n\n⚠️ Buyer beware. Please perform your own due diligence.",
    },
    {
      templateKey: "DETAILED",
      name: "Detailed WhatsApp advert",
      body: "{{title}}\n\n{{description}}\n\n💰 {{price}}\n📍 {{location}}\n\n📞 Contact {{contact}}:\n{{whatsapp}}\n\nView full advert:\n{{url}}\n\n⚠️ Buyer beware. LocalReach does not guarantee transactions. Perform your own due diligence before paying.",
    },
    {
      templateKey: "BUSINESS_SPECIAL",
      name: "Business special",
      body: "🏪 {{communityName}} SPECIAL\n\n{{title}}\n\n{{description}}\n\n💰 {{price}}\n📍 {{location}}\n\n📞 Chat to the business:\n{{whatsapp}}\n\n👉 Full details:\n{{url}}",
    },
  ];
  for (const t of templates) {
    await prisma.whatsAppTemplate.upsert({
      where: {
        communityId_templateKey: {
          communityId: community.id,
          templateKey: t.templateKey,
        },
      },
      create: { communityId: community.id, ...t },
      update: { body: t.body },
    });
  }

  // Default (global) platform plans as fallback
  for (const plan of defaultPlans(community.id).map((p) => ({ ...p, communityId: null }))) {
    const existing = await prisma.pricingPlan.findFirst({
      where: { communityId: null, planKey: plan.planKey },
    });
    if (!existing) {
      await prisma.pricingPlan.create({ data: plan });
    }
  }
  // Platform-default revenue share (70/30)
  const platformShare = await prisma.revenueShareRule.findFirst({
    where: { communityId: null },
  });
  if (!platformShare) {
    await prisma.revenueShareRule.create({
      data: { platformPercentage: 70, communityPercentage: 30 },
    });
  }

  return community;
}

async function seedMembers(communityId: string, userIds: string[]) {
  for (const userId of userIds) {
    await prisma.communityMember.upsert({
      where: { userId_communityId: { userId, communityId } },
      create: { userId, communityId },
      update: {},
    });
  }
}

async function seedBusinesses(communityId: string, businessOwnerId: string) {
  const mk = async (data: {
    businessName: string;
    slug: string;
    description: string;
    categorySlug: string;
    phone: string;
    whatsapp: string;
    suburb: string;
    verified: boolean;
  }) => {
    const category = await prisma.category.findUnique({
      where: { communityId_slug: { communityId, slug: data.categorySlug } },
    });
    const existing = await prisma.businessProfile.findUnique({
      where: { slug: data.slug },
    });
    if (existing) return existing;
    return prisma.businessProfile.create({
      data: {
        ownerId: businessOwnerId,
        communityId,
        businessName: data.businessName,
        slug: data.slug,
        description: data.description,
        categoryId: category?.id,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: `hello@${data.slug.split("-")[0]}.co.za`,
        suburb: data.suburb,
        city: "Durban",
        province: "KwaZulu-Natal",
        verificationStatus: data.verified ? "VERIFIED" : "NOT_VERIFIED",
        verifiedAt: data.verified ? new Date() : null,
        tradingHours: [
          { day: "Mon–Fri", open: "07:00", close: "17:00" },
          { day: "Sat", open: "08:00", close: "14:00" },
          { day: "Sun", closed: true },
        ],
      },
    });
  };

  const cafe = await mk({
    businessName: "Corner Café Durban North",
    slug: "corner-cafe-durban-north",
    description:
      "Your friendly neighbourhood café serving fresh breakfasts, barista coffee and daily lunch specials. We cater for community events too.",
    categorySlug: "restaurants",
    phone: "0315631100",
    whatsapp: "0821234567",
    suburb: "Durban North",
    verified: true,
  });
  const supermarket = await mk({
    businessName: "Umgeni Fresh Market",
    slug: "umgeni-fresh-market",
    description:
      "Local fresh produce market with weekly specials on fruit, vegetables and household staples. Order via WhatsApp for collection.",
    categorySlug: "supermarkets",
    phone: "0315632200",
    whatsapp: "0837654321",
    suburb: "Umgeni Park",
    verified: false,
  });

  await prisma.businessSpecial.createMany({
    data: [
      {
        businessId: cafe.id,
        communityId,
        title: "R55 Breakfast Special",
        description:
          "Full breakfast with coffee — weekdays before 10am. Dine in or collect.",
        priceNote: "R55",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
      {
        businessId: supermarket.id,
        communityId,
        title: "Weekend Produce Box",
        description:
          "Seasonal fruit & veg box (feeds a family of 4). Order by Friday 12:00.",
        priceNote: "R120",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    ],
    skipDuplicates: true,
  });

  return { cafe, supermarket };
}

async function seedAdverts(communityId: string, advertiserIds: string[]) {
  const now = new Date();
  const categories = await prisma.category.findMany({ where: { communityId } });
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));
  const bySlug = (slug: string) => categoryMap.get(slug) ?? categories[0];

  const mkAdvert = async (data: {
    advertiserId: string;
    title: string;
    description: string;
    categorySlug: string;
    price: number | null;
    priceType?:
      | "FIXED"
      | "FREE"
      | "FROM"
      | "PER_DAY"
      | "PER_MONTH"
      | "CONTACT_SELLER"
      | "NEGOTIABLE";
    suburb?: string;
    featured?: boolean;
    status?: "PUBLISHED" | "PENDING_REVIEW";
    ageDays: number;
  }) => {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const existing = await prisma.advert.findUnique({ where: { slug } });
    if (existing) return existing;
    const createdAt = new Date(now.getTime() - data.ageDays * 24 * 60 * 60 * 1000);
    const status = data.status ?? "PUBLISHED";
    return prisma.advert.create({
      data: {
        communityId,
        advertiserId: data.advertiserId,
        title: data.title,
        slug,
        description: data.description,
        categoryId: bySlug(data.categorySlug)?.id ?? "00000000-0000-0000-0000-000000000000",
        price: data.price,
        priceType: data.priceType ?? "FIXED",
        suburb: data.suburb ?? "Umgeni Park",
        city: "Durban",
        province: "KwaZulu-Natal",
        contactName: "Community Seller",
        contactPhone: "0821234567",
        whatsappNumber: "0821234567",
        status,
        moderationStatus: status === "PUBLISHED" ? "APPROVED" : "PENDING",
        publishedAt: status === "PUBLISHED" ? createdAt : null,
        expiresAt:
          status === "PUBLISHED"
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null,
        isFeatured: data.featured ?? false,
        featuredUntil: data.featured
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null,
        createdAt,
      },
    });
  };

  await mkAdvert({
    advertiserId: advertiserIds[0] as string,
    title: "3 Bedroom House for Sale — Umgeni Park",
    description:
      "Well-maintained 3 bedroom home with 2 bathrooms, double garage and a lovely garden. Walking distance to Umgeni Park shops and schools, minutes from the beachfront.",
    categorySlug: "property",
    price: 1850000,
    suburb: "Umgeni Park",
    featured: true,
    ageDays: 2,
  });
  await mkAdvert({
    advertiserId: advertiserIds[1] as string,
    title: "Mountain Bikes — Two Adult Bikes",
    description:
      "Two adult mountain bikes, serviced and ready to ride. Ideal for the Umgeni trail. Sold together as one deal.",
    categorySlug: "vehicles",
    price: 3500,
    priceType: "NEGOTIABLE",
    ageDays: 1,
  });
  await mkAdvert({
    advertiserId: advertiserIds[0] as string,
    title: "Baby cot and changing table",
    description:
      "Solid wooden baby cot with mattress plus matching changing table. Good condition, from a smoke-free home.",
    categorySlug: "kids-and-family",
    price: 900,
    ageDays: 3,
  });
  await mkAdvert({
    advertiserId: advertiserIds[1] as string,
    title: "Garden service — weekly or once-off",
    description:
      "Reliable local garden service. Mowing, edging, pruning and green waste removal. Free quotes for Umgeni Park and Durban North residents.",
    categorySlug: "services",
    price: 250,
    priceType: "FROM",
    ageDays: 4,
  });
  await mkAdvert({
    advertiserId: advertiserIds[0] as string,
    title: "Free paving offcuts (collection only)",
    description:
      "About 30 paving offcuts free to a good home — perfect for a small garden path. Collection in Umgeni Park this week.",
    categorySlug: "home-and-garden",
    price: null,
    priceType: "FREE",
    ageDays: 5,
  });
  await mkAdvert({
    advertiserId: advertiserIds[1] as string,
    title: "Maths tutor — Grade 8 to 12",
    description:
      "Experienced local teacher offering maths lessons. References available on request.",
    categorySlug: "classes-and-lessons",
    price: 250,
    priceType: "PER_DAY",
    ageDays: 6,
  });
  await mkAdvert({
    advertiserId: advertiserIds[0] as string,
    title: "Kitchen table and chairs (6 seater)",
    description:
      "Solid oak 6-seater kitchen table with matching chairs. A few small marks, otherwise great condition.",
    categorySlug: "for-sale",
    price: 4200,
    featured: true,
    ageDays: 1,
  });
  await mkAdvert({
    advertiserId: advertiserIds[1] as string,
    title: "Bicycle helmet and cycling gear",
    description:
      "Brand-new cycling helmet (size L) and a set of padded cycling gloves. Collection in Durban North.",
    categorySlug: "for-sale",
    price: 650,
    status: "PENDING_REVIEW",
    ageDays: 0,
  });
}

async function main() {
  console.log("Seeding LocalReach…");
  await seedPermissions();
  await seedSuperAdmin();
  const users = await seedUsers();
  const community = await seedCommunity(users.owner.id);
  // Create CommunityAdmin records for owner and moderator
  await prisma.communityAdmin.upsert({
    where: { userId_communityId: { userId: users.owner.id, communityId: community.id } },
    create: { userId: users.owner.id, communityId: community.id, role: "COMMUNITY_OWNER" },
    update: {},
  });
  await prisma.communityAdmin.upsert({
    where: { userId_communityId: { userId: users.moderator.id, communityId: community.id } },
    create: { userId: users.moderator.id, communityId: community.id, role: "MODERATOR" },
    update: {},
  });
  await seedMembers(community.id, [
    users.owner.id,
    users.moderator.id,
    users.advertiser1.id,
    users.advertiser2.id,
    users.businessOwner.id,
  ]);
  await seedBusinesses(community.id, users.businessOwner.id);
  await seedAdverts(community.id, [
    users.advertiser1.id,
    users.advertiser2.id,
  ]);
  console.log("Seed complete.");
  console.log(`  Super admin: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
  console.log("  Demo users:  owner@localreach.test, moderator@localreach.test,");
  console.log("               thandi@example.com, john@example.com, cornercafe@example.com / Demo1234!");
  console.log(`  Community:   ${community.name} (/community/${community.slug})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
