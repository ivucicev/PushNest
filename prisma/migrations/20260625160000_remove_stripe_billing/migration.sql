-- Remove Stripe billing columns
DROP INDEX IF EXISTS "User_stripeCustomerId_key";
DROP INDEX IF EXISTS "User_stripeSubscriptionId_key";
ALTER TABLE "User" DROP COLUMN "plan";
ALTER TABLE "User" DROP COLUMN "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN "stripeSubscriptionId";
ALTER TABLE "User" DROP COLUMN "stripePriceId";
ALTER TABLE "User" DROP COLUMN "planCurrentPeriodEnd";
