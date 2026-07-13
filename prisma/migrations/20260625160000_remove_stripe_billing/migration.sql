-- Remove Stripe billing columns
ALTER TABLE "User" DROP COLUMN "plan";
ALTER TABLE "User" DROP COLUMN "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN "stripeSubscriptionId";
ALTER TABLE "User" DROP COLUMN "stripePriceId";
ALTER TABLE "User" DROP COLUMN "planCurrentPeriodEnd";
