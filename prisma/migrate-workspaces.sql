-- Migration: single-tenant (BusinessProfile) -> multi-tenant (Business + Membership + Invite)
-- Preserves existing data. Safe to run once.

BEGIN;

-- 1. Enum for roles
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER');

-- 2. New Business table (rename + drop user-scoped constraint)
CREATE TABLE "Business" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "addressLines" TEXT[] NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "logoUrl" TEXT,
  "taxId" TEXT,
  "bankDetails" TEXT,
  "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  "defaultTaxRate" INTEGER NOT NULL DEFAULT 0,
  "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
  "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
  "defaultTemplate" "InvoiceTemplate" NOT NULL DEFAULT 'CLASSIC',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Membership
CREATE TABLE "Membership" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Membership_userId_businessId_key" ON "Membership"("userId", "businessId");
CREATE INDEX "Membership_businessId_idx" ON "Membership"("businessId");

-- 4. Invite
CREATE TABLE "Invite" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
  "invitedById" TEXT NOT NULL REFERENCES "User"("id"),
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Invite_businessId_email_key" ON "Invite"("businessId", "email");
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- 5. Backfill Business rows from existing BusinessProfile; create OWNER membership for each owner
INSERT INTO "Business" (
  "id", "name", "addressLines", "email", "phone", "logoUrl", "taxId", "bankDetails",
  "defaultCurrency", "defaultTaxRate", "invoicePrefix", "nextInvoiceNumber",
  "defaultTemplate", "createdAt", "updatedAt"
)
SELECT
  "id", "name", "addressLines", "email", "phone", "logoUrl", "taxId", "bankDetails",
  "defaultCurrency", "defaultTaxRate", "invoicePrefix", "nextInvoiceNumber",
  "defaultTemplate", COALESCE("updatedAt", CURRENT_TIMESTAMP), COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM "BusinessProfile";

INSERT INTO "Membership" ("id", "userId", "businessId", "role", "createdAt")
SELECT
  gen_random_uuid()::text, bp."userId", bp."id", 'OWNER', CURRENT_TIMESTAMP
FROM "BusinessProfile" bp;

-- 6. Add businessId to Client, backfill from owning user's BusinessProfile
ALTER TABLE "Client" ADD COLUMN "businessId" TEXT;
UPDATE "Client" c SET "businessId" = bp."id"
FROM "BusinessProfile" bp WHERE c."userId" = bp."userId";
ALTER TABLE "Client" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Client" ADD CONSTRAINT "Client_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;
CREATE INDEX "Client_businessId_idx" ON "Client"("businessId");
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_userId_fkey";
DROP INDEX IF EXISTS "Client_userId_idx";
ALTER TABLE "Client" DROP COLUMN "userId";

-- 7. Product
ALTER TABLE "Product" ADD COLUMN "businessId" TEXT;
UPDATE "Product" p SET "businessId" = bp."id"
FROM "BusinessProfile" bp WHERE p."userId" = bp."userId";
ALTER TABLE "Product" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;
CREATE INDEX "Product_businessId_idx" ON "Product"("businessId");
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_userId_fkey";
DROP INDEX IF EXISTS "Product_userId_idx";
ALTER TABLE "Product" DROP COLUMN "userId";

-- 8. Invoice (businessId + rename userId -> createdByUserId)
ALTER TABLE "Invoice" ADD COLUMN "businessId" TEXT;
UPDATE "Invoice" i SET "businessId" = bp."id"
FROM "BusinessProfile" bp WHERE i."userId" = bp."userId";
ALTER TABLE "Invoice" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;

-- Rename userId -> createdByUserId, keep nullable
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_userId_fkey";
ALTER TABLE "Invoice" RENAME COLUMN "userId" TO "createdByUserId";
ALTER TABLE "Invoice" ALTER COLUMN "createdByUserId" DROP NOT NULL;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Rebuild indexes (from userId-based to businessId-based)
DROP INDEX IF EXISTS "Invoice_userId_status_idx";
DROP INDEX IF EXISTS "Invoice_userId_issueDate_idx";
DROP INDEX IF EXISTS "Invoice_userId_clientId_idx";
DROP INDEX IF EXISTS "Invoice_userId_status_dueDate_idx";
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_userId_number_key";

CREATE INDEX "Invoice_businessId_status_idx" ON "Invoice"("businessId", "status");
CREATE INDEX "Invoice_businessId_issueDate_idx" ON "Invoice"("businessId", "issueDate");
CREATE INDEX "Invoice_businessId_clientId_idx" ON "Invoice"("businessId", "clientId");
CREATE INDEX "Invoice_businessId_status_dueDate_idx" ON "Invoice"("businessId", "status", "dueDate");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_number_key" UNIQUE ("businessId", "number");

-- 9. RecurringSchedule
ALTER TABLE "RecurringSchedule" ADD COLUMN "businessId" TEXT;
UPDATE "RecurringSchedule" r SET "businessId" = bp."id"
FROM "BusinessProfile" bp WHERE r."userId" = bp."userId";
ALTER TABLE "RecurringSchedule" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "RecurringSchedule" ADD CONSTRAINT "RecurringSchedule_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;
DROP INDEX IF EXISTS "RecurringSchedule_userId_active_nextRunAt_idx";
CREATE INDEX "RecurringSchedule_businessId_active_nextRunAt_idx"
  ON "RecurringSchedule"("businessId", "active", "nextRunAt");
ALTER TABLE "RecurringSchedule" DROP CONSTRAINT IF EXISTS "RecurringSchedule_userId_fkey";
ALTER TABLE "RecurringSchedule" DROP COLUMN "userId";

-- 10. Drop the old BusinessProfile table
DROP TABLE "BusinessProfile";

COMMIT;
