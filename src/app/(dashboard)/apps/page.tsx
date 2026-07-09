import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Plus, Zap, ExternalLink } from "lucide-react";

export default async function AppsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const apps = await prisma.app.findMany({
    where: { userId: session.id },
    include: {
      _count: {
        select: { subscriptions: { where: { status: "ACTIVE" } }, notifications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apps</h1>
          <p className="text-sm text-slate-500 mt-0.5">{apps.length} app{apps.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/apps/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> New App
        </Link>
      </div>

      {apps.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No apps yet</h2>
          <p className="text-slate-500 mb-6">Create your first app to get started with push notifications.</p>
          <Link
            href="/apps/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create App
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apps.map((app) => (
            <Link key={app.id} href={`/apps/${app.id}`}>
              <Card className="p-6 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {app.name}
                        </h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <p className="text-xs text-slate-400">{app.domain}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{app._count.subscriptions.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">subscribers</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{app._count.notifications.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">notifications</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
