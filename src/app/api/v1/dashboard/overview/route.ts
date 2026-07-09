import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized } from "@/lib/response";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userApps = await prisma.app.findMany({
    where: { userId: session.id },
    select: { id: true },
  });
  const appIds = userApps.map((a) => a.id);

  if (appIds.length === 0) {
    return ok({
      totalApps: 0,
      activeSubscriptions: 0,
      todayNotifications: 0,
      successRate: 0,
      recentCampaigns: [],
      recentFailures: [],
    });
  }

  const [
    totalApps,
    activeSubscriptions,
    todayNotifications,
    sentLogs,
    failedLogs,
    recentCampaigns,
    recentFailures,
  ] = await Promise.all([
    prisma.app.count({ where: { userId: session.id } }),
    prisma.pushSubscription.count({ where: { appId: { in: appIds }, status: "ACTIVE" } }),
    prisma.notification.count({ where: { appId: { in: appIds }, createdAt: { gte: today } } }),
    prisma.deliveryLog.count({ where: { appId: { in: appIds }, status: "SENT" } }),
    prisma.deliveryLog.count({ where: { appId: { in: appIds }, status: "FAILED" } }),
    prisma.campaign.findMany({
      where: { appId: { in: appIds } },
      select: {
        id: true, title: true, status: true, sentAt: true, createdAt: true,
        app: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.deliveryLog.findMany({
      where: { appId: { in: appIds }, status: "FAILED" },
      select: {
        id: true, errorMessage: true, createdAt: true,
        notification: { select: { id: true, title: true } },
        subscription: { select: { id: true, platform: true, browser: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalLogs = sentLogs + failedLogs;
  const successRate = totalLogs > 0 ? Math.round((sentLogs / totalLogs) * 100) : 0;

  return ok({
    totalApps,
    activeSubscriptions,
    todayNotifications,
    successRate,
    recentCampaigns,
    recentFailures,
  });
}
