import { z } from "zod";

export const PRICE_TYPES = [
  "FIXED",
  "NEGOTIABLE",
  "FREE",
  "FROM",
  "PER_DAY",
  "PER_MONTH",
  "CONTACT_SELLER",
] as const;

export const ADVERT_VISIBILITIES = ["PUBLIC", "COMMUNITY_ONLY", "UNLISTED"] as const;

const southAfricanPhone = z
  .string()
  .trim()
  .regex(
    /^(\+?27|0)[0-9]{9}$/,
    "Enter a valid South African phone number (e.g. 0821234567)"
  );

export const createAdvertSchema = z.object({
  communityId: z.string().uuid(),
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional().nullable(),
  price: z.number().min(0).max(99_999_999).optional().nullable(),
  priceType: z.enum(PRICE_TYPES).default("FIXED"),
  suburb: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  location: z.string().trim().max(160).optional().default(""),
  contactName: z.string().trim().min(2, "Contact name is required").max(80),
  contactPhone: southAfricanPhone.optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  whatsappNumber: southAfricanPhone.optional().or(z.literal("")),
  externalWebsite: z.string().url().optional().or(z.literal("")),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        thumbnailUrl: z.string().optional(),
        alt: z.string().max(160).optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        sizeBytes: z.number().int().positive().optional(),
        mimeType: z.string().max(60).optional(),
      })
    )
    .max(10)
    .default([]),
  visibility: z.enum(ADVERT_VISIBILITIES).default("PUBLIC"),
  submit: z.boolean().default(true), // false => save as draft
});

export type CreateAdvertInput = z.infer<typeof createAdvertSchema>;

export const updateAdvertSchema = createAdvertSchema.partial().extend({
  id: z.string().uuid(),
});

export const moderationDecisionSchema = z.object({
  advertId: z.string().uuid(),
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "FLAG", "EDIT"]),
  reason: z
    .enum([
      "Too many photos",
      "Posting frequency violation",
      "Prohibited item",
      "Prohibited content",
      "Incorrect category",
      "Duplicate advert",
      "External platform promotion",
      "Other",
    ])
    .optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const reportAdvertSchema = z.object({
  advertId: z.string().uuid(),
  reason: z.enum([
    "SCAM",
    "PROHIBITED_ITEM",
    "INAPPROPRIATE_CONTENT",
    "SPAM",
    "FALSE_INFORMATION",
    "DUPLICATE",
    "OTHER",
  ]),
  details: z.string().trim().max(1000).optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  marketingOptIn: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(5000),
  categoryId: z.string().uuid().optional().nullable(),
  phone: southAfricanPhone.optional().or(z.literal("")),
  whatsapp: southAfricanPhone.optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().trim().max(200).optional(),
  suburb: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  tradingHours: z
    .array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean().optional(),
      })
    )
    .max(7)
    .optional(),
  socialLinks: z.record(z.string()).optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
});

export const businessSpecialSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  priceNote: z.string().trim().max(60).optional(),
  images: z.array(z.string()).max(2).default([]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const BOOST_PLAN_KEYS = ["BOOST", "PREMIUM"] as const;

export const startBoostSchema = z.object({
  advertId: z.string().uuid(),
  planKey: z.enum(BOOST_PLAN_KEYS),
});

export type ModerationDecisionInput = z.infer<typeof moderationDecisionSchema>;
