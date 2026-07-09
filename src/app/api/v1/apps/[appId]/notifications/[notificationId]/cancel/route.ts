import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string; notificationId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, notificationId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, appId },
  });
  if (!notification) return notFound("Notification");
  if (notification.status !== "SCHEDULED") {
    return err(`Cannot cancel notification with status ${notification.status}`, 400);
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: "CANCELLED", updatedAt: new Date() },
  });

  return ok({ ok: true });
}
