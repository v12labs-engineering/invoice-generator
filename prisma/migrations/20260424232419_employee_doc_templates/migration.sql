-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('OFFER_LETTER', 'EMPLOYMENT_CONTRACT', 'NDA', 'RELIEVING_LETTER', 'EXPERIENCE_LETTER', 'SALARY_CERTIFICATE', 'PROMOTION_LETTER', 'WARNING_LETTER', 'TERMINATION_LETTER', 'PAYSLIP');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "docType" "DocType";
ALTER TABLE "Document" ADD COLUMN "generatedBody" TEXT;

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_businessId_docType_key" ON "DocumentTemplate"("businessId", "docType");

-- CreateIndex
CREATE INDEX "DocumentTemplate_businessId_idx" ON "DocumentTemplate"("businessId");

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
