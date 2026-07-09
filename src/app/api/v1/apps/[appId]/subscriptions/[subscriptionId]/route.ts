import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden } from "@/lib/response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string; subscriptionId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, subscriptionId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const sub = await prisma.pushSubscription.findFirst({
    where: { id: subscriptionId, appId },
  });
  if (!sub) return notFound("Subscription");

  await prisma.pushSubscription.update({
    where: { id: subscriptionId },
    data: { status: "UNSUBSCRIBED" },
  });
  return ok({ ok: true });
}
