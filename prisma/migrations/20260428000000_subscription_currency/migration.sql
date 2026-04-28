-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "currency" SET DEFAULT 'USD';
