import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Monitor, Smartphone } from "lucide-react";

export default async function SubscriptionsPage({ params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { appId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app || app.userId !== session.id) notFound();

  const [subs, counts] = await Promise.all([
    prisma.pushSubscription.findMany({
      where: { appId },
      select: {
        id: true, externalUserId: true, deviceId: true,
        platform: true, browser: true, status: true,
        createdAt: true, lastSeenAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.pushSubscription.groupBy({
      by: ["status"],
      where: { appId },
      _count: true,
    }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscribers</h1>
        <p className="text-sm text-slate-500 mt-1">{subs.length} subscription{subs.length !== 1 ? "s" : ""} (showing latest 100)</p>
      </div>

      <div className="flex gap-3">
        {["ACTIVE", "EXPIRED", "FAILED", "UNSUBSCRIBED"].map((s) => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-bold text-slate-900">{statusCounts[s] ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Device</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">External User ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No subscribers yet. Add the integration snippet to your app.
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.platform?.toLowerCase().includes("ios") || s.platform?.toLowerCase().includes("android")
                          ? <Smartphone className="w-4 h-4 text-slate-400" />
                          : <Monitor className="w-4 h-4 text-slate-400" />
                        }
                        <div>
                          <p className="font-medium text-slate-800">{s.browser ?? "Unknown"}</p>
                          <p className="text-xs text-slate-400">{s.platform ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {s.externalUserId ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.lastSeenAt).toLocaleDateString()}</td>
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
