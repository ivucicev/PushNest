import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeSubscriptions,
    totalSubscriptions,
    totalNotifications,
    todayNotifications,
    sentLogs,
    failedLogs,
    recentNotifications,
  ] = await Promise.all([
    prisma.pushSubscription.count({ where: { appId, status: "ACTIVE" } }),
    prisma.pushSubscription.count({ where: { appId } }),
    prisma.notification.count({ where: { appId } }),
    prisma.notification.count({ where: { appId, createdAt: { gte: today } } }),
    prisma.deliveryLog.count({ where: { appId, status: "SENT" } }),
    prisma.deliveryLog.count({ where: { appId, status: "FAILED" } }),
    prisma.notification.findMany({
      where: { appId },
      select: {
        id: true, title: true, status: true,
        totalCount: true, sentCount: true, failedCount: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalLogs = sentLogs + failedLogs;
  const successRate = totalLogs > 0 ? Math.round((sentLogs / totalLogs) * 100) : 0;

  return ok({
    activeSubscriptions,
    totalSubscriptions,
    totalNotifications,
    todayNotifications,
    sentCount: sentLogs,
    failedCount: failedLogs,
    successRate,
    recentNotifications,
  });
}
