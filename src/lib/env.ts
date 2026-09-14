import { z } from "zod";

/**
 * Server-side environment access. Secrets are never imported into client components —
 * this module must only be imported from server code.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Storage
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().optional(),
  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("LocalReach <no-reply@localhost>"),
  // Payments
  PAYFAST_MERCHANT_ID: z.string().optional(),
  PAYFAST_MERCHANT_KEY: z.string().optional(),
  PAYFAST_PASSPHRASE: z.string().optional(),
  PAYFAST_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Moderation
  MODERATION_API_KEY: z.string().optional(),
  MODERATION_API_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && process.env.NODE_ENV !== "test") {
  // Surface a readable error, but do not crash builds that legitimately lack runtime env.
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
}

const raw =
  parsed.success
    ? parsed.data
    : ({
        ...process.env,
        NODE_ENV: process.env.NODE_ENV ?? "development",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        NEXT_PUBLIC_APP_URL:
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        EMAIL_FROM: process.env.EMAIL_FROM ?? "LocalReach <no-reply@localhost>",
        PAYFAST_MODE: process.env.PAYFAST_MODE ?? "sandbox",
      } as z.infer<typeof envSchema>);



export const env = {
  ...raw,
  get isProd() {
    return raw.NODE_ENV === "production";
  },
  get appUrl() {
    return (raw.NEXT_PUBLIC_APP_URL ?? raw.NEXTAUTH_URL).replace(/\/$/, "");
  },
  get googleOAuthEnabled() {
    return Boolean(raw.GOOGLE_CLIENT_ID && raw.GOOGLE_CLIENT_SECRET);
  },
  get payfastEnabled() {
    return Boolean(
      raw.PAYFAST_MERCHANT_ID && raw.PAYFAST_MERCHANT_KEY
    );
  },
  get storageEnabled() {
    return Boolean(
      raw.STORAGE_ENDPOINT &&
        raw.STORAGE_ACCESS_KEY &&
        raw.STORAGE_SECRET_KEY &&
        raw.STORAGE_BUCKET
    );
  },
  get resendEnabled() {
    return Boolean(raw.RESEND_API_KEY);
  },
  get moderationApiEnabled() {
    return Boolean(raw.MODERATION_API_KEY && raw.MODERATION_API_URL);
  },
};

export type Env = typeof env;
