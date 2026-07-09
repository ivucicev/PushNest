-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "scheduledAt" DATETIME;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "scheduledAt" DATETIME;
