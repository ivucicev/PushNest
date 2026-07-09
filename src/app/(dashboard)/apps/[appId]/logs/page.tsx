import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

export default async function LogsPage({ params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { appId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app || app.userId !== session.id) notFound();

  const logs = await prisma.deliveryLog.findMany({
    where: { appId },
    include: {
      notification: { select: { title: true } },
      subscription: { select: { browser: true, platform: true, externalUserId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Last {logs.length} delivery attempts (showing latest 200)
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Notification</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subscriber</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Error</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No delivery logs yet. Send a notification to see logs here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]">{log.notification.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{log.subscription.browser ?? "Unknown"}</p>
                      {log.subscription.externalUserId && (
                        <p className="text-xs text-slate-400 font-mono">{log.subscription.externalUserId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.statusCode ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">
                      {log.errorMessage ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
