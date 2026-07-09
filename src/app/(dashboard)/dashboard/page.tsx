import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Plus, Zap } from "lucide-react";

async function getOverview(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const apps = await prisma.app.findMany({ where: { userId }, select: { id: true } });
  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return { totalApps: 0, activeSubscriptions: 0, todayNotifications: 0, successRate: 0, recentCampaigns: [], recentFailures: [] };
  }

  const [totalApps, activeSubscriptions, todayNotifications, sentLogs, failedLogs, recentCampaigns, recentFailures] = await Promise.all([
    prisma.app.count({ where: { userId } }),
    prisma.pushSubscription.count({ where: { appId: { in: appIds }, status: "ACTIVE" } }),
    prisma.notification.count({ where: { appId: { in: appIds }, createdAt: { gte: today } } }),
    prisma.deliveryLog.count({ where: { appId: { in: appIds }, status: "SENT" } }),
    prisma.deliveryLog.count({ where: { appId: { in: appIds }, status: "FAILED" } }),
    prisma.campaign.findMany({
      where: { appId: { in: appIds } },
      select: { id: true, title: true, status: true, sentAt: true, createdAt: true, app: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.deliveryLog.findMany({
      where: { appId: { in: appIds }, status: "FAILED" },
      select: { id: true, errorMessage: true, createdAt: true, notification: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalLogs = sentLogs + failedLogs;
  return {
    totalApps, activeSubscriptions, todayNotifications,
    successRate: totalLogs > 0 ? Math.round((sentLogs / totalLogs) * 100) : 0,
    recentCampaigns, recentFailures,
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getOverview(session.id);

  const stats = [
    { label: "Total Apps", value: data.totalApps },
    { label: "Active Subscribers", value: data.activeSubscriptions.toLocaleString() },
    { label: "Sent Today", value: data.todayNotifications.toLocaleString() },
    { label: "Success Rate", value: `${data.successRate}%` },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your PushNest dashboard</p>
        </div>
        <Link
          href="/apps/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> New App
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-5">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.totalApps === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Create your first app</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Register an app to get your VAPID keys, API key, and integration snippet.
          </p>
          <Link
            href="/apps/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create App
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Campaigns</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentCampaigns.length === 0 ? (
              <div className="p-6 text-sm text-slate-400 text-center">No campaigns yet</div>
            ) : (
              data.recentCampaigns.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.app.name}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Failures</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentFailures.length === 0 ? (
              <div className="p-6 text-sm text-slate-400 text-center">No failures — looking good!</div>
            ) : (
              data.recentFailures.map((f) => (
                <div key={f.id} className="p-4">
                  <p className="text-sm font-medium text-slate-900 truncate">{f.notification.title}</p>
                  <p className="text-xs text-red-500 mt-0.5 truncate">{f.errorMessage ?? "Unknown error"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(f.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
