-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PLATFORM_MODERATOR', 'COMMUNITY_OWNER', 'COMMUNITY_ADMIN', 'MODERATOR', 'BUSINESS_OWNER', 'ADVERTISER', 'USER');

-- CreateEnum
CREATE TYPE "CommunityStatus" AS ENUM ('PILOT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('POSTING_HOURS', 'MAX_WEEKLY_ADS', 'MAX_IMAGES', 'PROHIBITED_KEYWORDS', 'PROHIBITED_CATEGORIES', 'PROHIBITED_LINKS', 'REQUIRES_APPROVAL', 'MINIMUM_USER_AGE', 'MAX_AD_DURATION');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'NEGOTIABLE', 'FREE', 'FROM', 'PER_DAY', 'PER_MONTH', 'CONTACT_SELLER');

-- CreateEnum
CREATE TYPE "AdvertStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdvertVisibility" AS ENUM ('PUBLIC', 'COMMUNITY_ONLY', 'UNLISTED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'AUTO_APPROVED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AutomatedDecision" AS ENUM ('SAFE', 'REVIEW', 'BLOCK');

-- CreateEnum
CREATE TYPE "QuotaType" AS ENUM ('FREE_ADVERT', 'BOOST_PREMIUM', 'FREE_SPECIAL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlanKey" AS ENUM ('FREE', 'BOOST', 'PREMIUM', 'BUSINESS_MONTHLY', 'BUSINESS_ANNUAL', 'VERIFIED_BUSINESS');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "OrderItemType" AS ENUM ('ADVERT_BOOST', 'BUSINESS_SUBSCRIPTION', 'BUSINESS_VERIFICATION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYFAST', 'STRIPE', 'MOCK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'ENDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING_PAYOUT', 'APPROVED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SCAM', 'PROHIBITED_ITEM', 'INAPPROPRIATE_CONTENT', 'SPAM', 'FALSE_INFORMATION', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('AD_APPROVED', 'AD_REJECTED', 'AD_FLAGGED', 'ADVERT_EDITED', 'ADVERT_REMOVED', 'CHANGES_REQUESTED', 'USER_WARNED', 'USER_SUSPENDED', 'USER_BANNED', 'USER_UNRESTRICTED', 'REPORT_DISMISSED');

-- CreateEnum
CREATE TYPE "StrikeSeverity" AS ENUM ('WARNING', 'TEMPORARY_RESTRICTION', 'SUSPENSION', 'BAN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('AD_APPROVED', 'AD_REJECTED', 'AD_EXPIRING', 'AD_EXPIRED', 'QUOTA_WARNING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'BOOST_ACTIVATED', 'REPORT_UPDATE', 'BUSINESS_VERIFIED', 'MODERATION_WARNING');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'WHATSAPP_CLICK', 'PHONE_CLICK', 'WEBSITE_CLICK', 'SAVE', 'SHARE', 'REPORT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CommunityAdminRole" AS ENUM ('COMMUNITY_OWNER', 'COMMUNITY_ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "SpecialStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "suspendedUntil" TIMESTAMP(3),
    "bannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleName" "Role" NOT NULL,
    "permissionKey" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleName","permissionKey")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "tagline" TEXT,
    "suburb" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "status" "CommunityStatus" NOT NULL DEFAULT 'PILOT',
    "pilotStart" TIMESTAMP(3),
    "pilotEnd" TIMESTAMP(3),
    "launchedAt" TIMESTAMP(3),
    "freeAdLimit" INTEGER NOT NULL DEFAULT 2,
    "freeAdPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "maxAdImages" INTEGER NOT NULL DEFAULT 2,
    "maxAdDurationDays" INTEGER NOT NULL DEFAULT 30,
    "postingStartHour" INTEGER NOT NULL DEFAULT 6,
    "postingEndHour" INTEGER NOT NULL DEFAULT 20,
    "allowPostingHoursOverride" BOOLEAN NOT NULL DEFAULT true,
    "allowCollage" BOOLEAN NOT NULL DEFAULT true,
    "allowMultipleProducts" BOOLEAN NOT NULL DEFAULT true,
    "allowDailySpecials" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "warnAfter" INTEGER NOT NULL DEFAULT 1,
    "restrictAfter" INTEGER NOT NULL DEFAULT 2,
    "suspendAfter" INTEGER NOT NULL DEFAULT 3,
    "banAfter" INTEGER NOT NULL DEFAULT 5,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#158258',
    "footerText" TEXT,
    "whatsappInviteUrl" TEXT,
    "whatsappCtaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappCommunityName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("userId","communityId")
);

-- CreateTable
CREATE TABLE "CommunityAdmin" (
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" "CommunityAdminRole" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityAdmin_pkey" PRIMARY KEY ("userId","communityId")
);

-- CreateTable
CREATE TABLE "CommunityRule" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RuleType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'MEDIUM',
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isProhibited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advert" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "price" DECIMAL(12,2),
    "priceType" "PriceType" NOT NULL DEFAULT 'FIXED',
    "location" TEXT,
    "suburb" TEXT,
    "city" TEXT,
    "province" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "whatsappNumber" TEXT,
    "externalWebsite" TEXT,
    "status" "AdvertStatus" NOT NULL DEFAULT 'DRAFT',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "AdvertVisibility" NOT NULL DEFAULT 'PUBLIC',
    "automatedDecision" "AutomatedDecision",
    "riskScore" INTEGER,
    "moderationReasons" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "activeBoostKey" "PlanKey",
    "businessId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Advert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertImage" (
    "id" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertQuotaUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "advertId" TEXT,
    "quotaType" "QuotaType" NOT NULL DEFAULT 'FREE_ADVERT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertQuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedAdvert" (
    "userId" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "notifyOnExpiry" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedAdvert_pkey" PRIMARY KEY ("userId","advertId")
);

-- CreateTable
CREATE TABLE "AdvertInteraction" (
    "id" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "InteractionType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertView" (
    "id" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdvertView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "coverImage" TEXT,
    "categoryId" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "suburb" TEXT,
    "city" TEXT,
    "province" TEXT,
    "tradingHours" JSONB,
    "socialLinks" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verificationChecks" JSONB,
    "featuredUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSpecial" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "priceNote" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SpecialStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSpecial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessReview" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "planKey" "PlanKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'ONE_TIME',
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "boostDurationDays" INTEGER,
    "extraImages" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT,
    "itemType" "OrderItemType" NOT NULL,
    "planKey" "PlanKey" NOT NULL,
    "planId" TEXT NOT NULL,
    "advertId" TEXT,
    "businessId" TEXT,
    "months" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerReference" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "businessId" TEXT,
    "planKey" "PlanKey" NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueShareRule" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "platformPercentage" DECIMAL(5,2) NOT NULL,
    "communityPercentage" DECIMAL(5,2) NOT NULL,
    "adminPercentage" DECIMAL(5,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueShareRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueTransaction" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "platformAmount" DECIMAL(12,2) NOT NULL,
    "communityAmount" DECIMAL(12,2) NOT NULL,
    "adminAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPayout" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING_PAYOUT',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "approvedById" TEXT,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertReport" (
    "id" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "reporterId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "advertId" TEXT,
    "targetUserId" TEXT,
    "action" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStrike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "communityId" TEXT,
    "severity" "StrikeSeverity" NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStrike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "communityId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CommunityAdminRole" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "templateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_status_idx" ON "Community"("status");

-- CreateIndex
CREATE INDEX "CommunityMember_communityId_idx" ON "CommunityMember"("communityId");

-- CreateIndex
CREATE INDEX "CommunityAdmin_communityId_idx" ON "CommunityAdmin"("communityId");

-- CreateIndex
CREATE INDEX "CommunityRule_communityId_idx" ON "CommunityRule"("communityId");

-- CreateIndex
CREATE INDEX "CommunityRule_communityId_type_idx" ON "CommunityRule"("communityId", "type");

-- CreateIndex
CREATE INDEX "Category_communityId_isActive_idx" ON "Category"("communityId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Category_communityId_slug_key" ON "Category"("communityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_slug_key" ON "Subcategory"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Advert_slug_key" ON "Advert"("slug");

-- CreateIndex
CREATE INDEX "Advert_communityId_idx" ON "Advert"("communityId");

-- CreateIndex
CREATE INDEX "Advert_status_idx" ON "Advert"("status");

-- CreateIndex
CREATE INDEX "Advert_categoryId_idx" ON "Advert"("categoryId");

-- CreateIndex
CREATE INDEX "Advert_createdAt_idx" ON "Advert"("createdAt");

-- CreateIndex
CREATE INDEX "Advert_expiresAt_idx" ON "Advert"("expiresAt");

-- CreateIndex
CREATE INDEX "Advert_advertiserId_idx" ON "Advert"("advertiserId");

-- CreateIndex
CREATE INDEX "Advert_isFeatured_idx" ON "Advert"("isFeatured");

-- CreateIndex
CREATE INDEX "Advert_communityId_status_createdAt_idx" ON "Advert"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AdvertImage_advertId_idx" ON "AdvertImage"("advertId");

-- CreateIndex
CREATE INDEX "AdvertQuotaUsage_userId_communityId_quotaType_createdAt_idx" ON "AdvertQuotaUsage"("userId", "communityId", "quotaType", "createdAt");

-- CreateIndex
CREATE INDEX "AdvertQuotaUsage_communityId_createdAt_idx" ON "AdvertQuotaUsage"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedAdvert_advertId_idx" ON "SavedAdvert"("advertId");

-- CreateIndex
CREATE INDEX "AdvertInteraction_advertId_idx" ON "AdvertInteraction"("advertId");

-- CreateIndex
CREATE INDEX "AdvertInteraction_advertId_type_idx" ON "AdvertInteraction"("advertId", "type");

-- CreateIndex
CREATE INDEX "AdvertInteraction_createdAt_idx" ON "AdvertInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "AdvertView_advertId_day_idx" ON "AdvertView"("advertId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertView_advertId_day_key" ON "AdvertView"("advertId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_slug_key" ON "BusinessProfile"("slug");

-- CreateIndex
CREATE INDEX "BusinessProfile_communityId_idx" ON "BusinessProfile"("communityId");

-- CreateIndex
CREATE INDEX "BusinessProfile_ownerId_idx" ON "BusinessProfile"("ownerId");

-- CreateIndex
CREATE INDEX "BusinessProfile_verificationStatus_idx" ON "BusinessProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "BusinessSpecial_communityId_status_idx" ON "BusinessSpecial"("communityId", "status");

-- CreateIndex
CREATE INDEX "BusinessSpecial_businessId_idx" ON "BusinessSpecial"("businessId");

-- CreateIndex
CREATE INDEX "BusinessReview_businessId_idx" ON "BusinessReview"("businessId");

-- CreateIndex
CREATE INDEX "PricingPlan_communityId_isActive_idx" ON "PricingPlan"("communityId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_communityId_planKey_key" ON "PricingPlan"("communityId", "planKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_communityId_createdAt_idx" ON "Order"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_providerReference_key" ON "Payment"("provider", "providerReference");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_communityId_planKey_status_idx" ON "Subscription"("communityId", "planKey", "status");

-- CreateIndex
CREATE INDEX "Subscription_businessId_idx" ON "Subscription"("businessId");

-- CreateIndex
CREATE INDEX "RevenueShareRule_communityId_idx" ON "RevenueShareRule"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueTransaction_paymentId_key" ON "RevenueTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "RevenueTransaction_communityId_createdAt_idx" ON "RevenueTransaction"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPayout_communityId_status_idx" ON "CommunityPayout"("communityId", "status");

-- CreateIndex
CREATE INDEX "AdvertReport_communityId_status_idx" ON "AdvertReport"("communityId", "status");

-- CreateIndex
CREATE INDEX "AdvertReport_advertId_idx" ON "AdvertReport"("advertId");

-- CreateIndex
CREATE INDEX "ModerationAction_communityId_createdAt_idx" ON "ModerationAction"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_advertId_idx" ON "ModerationAction"("advertId");

-- CreateIndex
CREATE INDEX "UserStrike_userId_createdAt_idx" ON "UserStrike"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_communityId_createdAt_idx" ON "AuditLog"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_communityId_status_idx" ON "Invitation"("communityId", "status");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_communityId_templateKey_key" ON "WhatsAppTemplate"("communityId", "templateKey");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "Permission"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAdmin" ADD CONSTRAINT "CommunityAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAdmin" ADD CONSTRAINT "CommunityAdmin_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRule" ADD CONSTRAINT "CommunityRule_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advert" ADD CONSTRAINT "Advert_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertImage" ADD CONSTRAINT "AdvertImage_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertQuotaUsage" ADD CONSTRAINT "AdvertQuotaUsage_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertQuotaUsage" ADD CONSTRAINT "AdvertQuotaUsage_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAdvert" ADD CONSTRAINT "SavedAdvert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAdvert" ADD CONSTRAINT "SavedAdvert_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertInteraction" ADD CONSTRAINT "AdvertInteraction_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertInteraction" ADD CONSTRAINT "AdvertInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertView" ADD CONSTRAINT "AdvertView_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSpecial" ADD CONSTRAINT "BusinessSpecial_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSpecial" ADD CONSTRAINT "BusinessSpecial_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReview" ADD CONSTRAINT "BusinessReview_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPlan" ADD CONSTRAINT "PricingPlan_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueShareRule" ADD CONSTRAINT "RevenueShareRule_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueTransaction" ADD CONSTRAINT "RevenueTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPayout" ADD CONSTRAINT "CommunityPayout_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertReport" ADD CONSTRAINT "AdvertReport_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertReport" ADD CONSTRAINT "AdvertReport_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertReport" ADD CONSTRAINT "AdvertReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertReport" ADD CONSTRAINT "AdvertReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStrike" ADD CONSTRAINT "UserStrike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStrike" ADD CONSTRAINT "UserStrike_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStrike" ADD CONSTRAINT "UserStrike_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
