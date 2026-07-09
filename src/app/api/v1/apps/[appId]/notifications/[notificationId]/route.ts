import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden } from "@/lib/response";

export async function GET(
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
    include: {
      deliveryLogs: {
        select: {
          id: true, subscriptionId: true, status: true,
          statusCode: true, errorMessage: true, createdAt: true, sentAt: true,
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!notification) return notFound("Notification");

  return ok(notification);
}
