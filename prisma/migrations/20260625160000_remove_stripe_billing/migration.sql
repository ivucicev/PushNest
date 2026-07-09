-- Remove Stripe billing columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripePriceId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "planCurrentPeriodEnd";
