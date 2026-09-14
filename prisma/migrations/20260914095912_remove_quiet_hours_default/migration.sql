-- AlterTable
ALTER TABLE "Community" ALTER COLUMN "postingStartHour" SET DEFAULT 0,
ALTER COLUMN "postingEndHour" SET DEFAULT 0;

-- Opt every existing community out of quiet-hour restrictions: members may
-- submit adverts at any time (equal start/end = unrestricted).
UPDATE "Community" SET "postingStartHour" = 0, "postingEndHour" = 0 WHERE "deletedAt" IS NULL;

-- Disable any seeded POSTING_HOURS rules so the moderation pipeline no longer
-- flags submissions during former quiet hours.
UPDATE "CommunityRule" SET "enabled" = false WHERE "type" = 'POSTING_HOURS';
