import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { NotificationActions } from "@/components/notifications/NotificationActions";
import { Send, Users, Bell, List } from "lucide-react";

export default async function AppDetailPage({ params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { appId } = await params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: {
      _count: {
        select: {
          subscriptions: { where: { status: "ACTIVE" } },
          notifications: true,
          campaigns: true,
        },
      },
    },
  });
  if (!app || app.userId !== session.id) notFound();

  const [sentToday, failedToday, recentNotifs] = await Promise.all([
    prisma.deliveryLog.count({ where: { appId, status: "SENT", createdAt: { gte: today } } }),
    prisma.deliveryLog.count({ where: { appId, status: "FAILED", createdAt: { gte: today } } }),
    prisma.notification.findMany({
      where: { appId },
      select: { id: true, title: true, status: true, totalCount: true, sentCount: true, failedCount: true, scheduledAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalToday = sentToday + failedToday;
  const successRate = totalToday > 0 ? Math.round((sentToday / totalToday) * 100) : 0;

  const stats = [
    { label: "Active Subscribers", value: app._count.subscriptions.toLocaleString(), icon: Users, href: "subscriptions" },
    { label: "Total Notifications", value: app._count.notifications.toLocaleString(), icon: Bell, href: "logs" },
    { label: "Sent Today", value: sentToday.toLocaleString(), icon: Send, href: "logs" },
    { label: "Success Rate Today", value: `${successRate}%`, icon: List, href: "logs" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{app.name}</h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-slate-400">{app.domain}</p>
        </div>
        <Link
          href={`/apps/${appId}/send`}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          <Send className="w-4 h-4" /> Send Notification
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={`/apps/${appId}/${s.href}`}>
            <Card className="hover:border-indigo-200 transition-colors cursor-pointer">
              <CardContent className="py-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Notifications</h3>
          <Link href={`/apps/${appId}/logs`} className="text-xs text-indigo-600 hover:underline">
            View all logs →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentNotifs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm mb-3">No notifications sent yet</p>
              <Link
                href={`/apps/${appId}/send`}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                Send your first notification →
              </Link>
            </div>
          ) : (
            recentNotifs.map((n) => (
              <div key={n.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {n.status === "SCHEDULED" && n.scheduledAt
                      ? `Scheduled for ${new Date(n.scheduledAt).toLocaleString()}`
                      : `${n.sentCount}/${n.totalCount} delivered · ${new Date(n.createdAt).toLocaleString()}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={n.status} />
                  <NotificationActions notificationId={n.id} appId={appId} status={n.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
