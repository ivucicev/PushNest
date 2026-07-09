import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CodeBlock, CopyButton } from "@/components/ui/CopyButton";
import { Clock } from "lucide-react";

export default async function IntegrationPage({ params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { appId } = await params;

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { id: true, name: true, vapidPublicKey: true, userId: true },
  });
  if (!app || app.userId !== session.id) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.pushnest.dev";

  // ── Snippets ──────────────────────────────────────────────

  const swContent = `// push-sw.js — place in your web root (e.g. /public/push-sw.js)
self.addEventListener('push', event => {
  const payload = event.data ? event.data.json() : {};
  const n = payload.notification || payload;
  event.waitUntil(
    self.registration.showNotification(n.title || 'Notification', {
      body: n.body || '',
      icon: n.icon,
      badge: n.badge,
      tag: n.tag,
      data: { url: n.url || '/', ...n.data },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});`;

  const subscribeSnippet = `// Call this when the user clicks "Enable notifications"
async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: '${app.vapidPublicKey}',
  });

  const { endpoint, keys } = subscription.toJSON();
  await fetch('${appUrl}/api/v1/apps/${app.id}/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      externalUserId: 'user_123', // optional — your own user ID for targeting
    }),
  });
}`;

  const sendNowCurl = `curl -X POST ${appUrl}/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Hello from PushNest!",
    "body": "Your first push notification.",
    "url": "https://yourapp.com"
  }'`;

  const sendNowResponse = `{
  "ok": true,
  "notificationId": "cmq...",
  "queued": 284,
  "scheduled": false,
  "scheduledAt": null
}`;

  const sendScheduledCurl = `curl -X POST ${appUrl}/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Weekly digest",
    "body": "Your stats are ready.",
    "url": "https://yourapp.com/stats",
    "scheduledAt": "2025-01-20T09:00:00Z"
  }'`;

  const sendScheduledResponse = `{
  "ok": true,
  "notificationId": "cmq...",
  "queued": 0,
  "scheduled": true,
  "scheduledAt": "2025-01-20T09:00:00.000Z"
}`;

  const sendTargetedCurl = `curl -X POST ${appUrl}/api/v1/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Your order shipped",
    "body": "Estimated delivery: tomorrow",
    "url": "https://yourapp.com/orders/123",
    "audience": {
      "externalUserIds": ["user_abc", "user_xyz"]
    }
  }'`;

  const sendFullSchema = `// POST ${appUrl}/api/v1/send
// POST ${appUrl}/api/v1/notifications/send   (identical)
{
  // Required
  "title": string,               // notification title

  // Optional content
  "body": string,                // notification body text
  "url": string,                 // URL opened on click
  "icon": string,                // icon image URL
  "badge": string,               // badge image URL
  "tag": string,                 // replaces previous notification with same tag

  // Optional scheduling
  "scheduledAt": string,         // ISO 8601 — future datetime, omit to send now

  // Optional targeting (default: all active subscribers)
  "audience": {
    "externalUserIds": string[], // target by your own user IDs
    "subscriptionIds": string[], // target by PushNest subscription IDs
  },

  // Optional custom data (passed to service worker)
  "data": object
}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integration Guide</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add push notifications to <strong>{app.name}</strong> in 3 steps.
        </p>
      </div>

      {/* ── Credentials ───────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>App credentials</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "App ID", value: app.id },
            { label: "VAPID Public Key", value: app.vapidPublicKey },
            { label: "Subscribe endpoint", value: `${appUrl}/api/v1/apps/${app.id}/subscribe` },
            { label: "Send endpoint", value: `${appUrl}/api/v1/send` },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-700 truncate">
                  {item.value}
                </code>
                <CopyButton text={item.value} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Step 1: Service worker ─────────────────── */}
      <Card>
        <CardHeader><CardTitle>Step 1 — Add the service worker</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Save as <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">push-sw.js</code> in your web root (e.g. <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">public/push-sw.js</code>). Must be served from the root domain to get full scope.
          </p>
          <CodeBlock code={swContent} language="javascript" />
        </CardContent>
      </Card>

      {/* ── Step 2: Subscribe ─────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Step 2 — Subscribe users</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Call on a user action (e.g. "Enable notifications" button). Browser requires a user gesture to call <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">requestPermission()</code>.
          </p>
          <CodeBlock code={subscribeSnippet} language="javascript" />
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700 mb-2">Subscribe request body</p>
            <p><code className="font-mono">endpoint</code> — from browser PushSubscription</p>
            <p><code className="font-mono">p256dh</code> — public key bytes (base64url)</p>
            <p><code className="font-mono">auth</code> — auth secret (base64url)</p>
            <p><code className="font-mono text-slate-400">externalUserId</code> — <em>optional</em> — your own user ID; used for targeting later</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Step 3: Send ──────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Step 3 — Send notifications</CardTitle></CardHeader>
        <CardContent className="space-y-6">

          {/* 3a: Send now */}
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Send immediately</p>
            <p className="text-sm text-slate-500 mb-3">
              Omit <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">scheduledAt</code> to send right now. Sends to all active subscribers unless <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">audience</code> is specified.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">Request</p>
                <CodeBlock code={sendNowCurl} language="bash" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">Response</p>
                <CodeBlock code={sendNowResponse} language="json" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3b: Scheduled */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold text-slate-800">Schedule for later</p>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">New</span>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Add <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">scheduledAt</code> with an ISO 8601 UTC datetime. The notification is stored as <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">SCHEDULED</code> and fired by the worker when the time arrives. Subscribers are resolved at fire time — not at schedule time — so the list is always fresh.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">Request</p>
                <CodeBlock code={sendScheduledCurl} language="bash" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">Response</p>
                <CodeBlock code={sendScheduledResponse} language="json" />
              </div>
            </div>
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              <strong>Note:</strong> <code className="font-mono">queued: 0</code> on a scheduled response is expected — delivery hasn&apos;t happened yet. Check <code className="font-mono">scheduled: true</code> and <code className="font-mono">scheduledAt</code> to confirm.
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3c: Targeted */}
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Target specific users</p>
            <p className="text-sm text-slate-500 mb-3">
              Pass <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">audience.externalUserIds</code> to send only to those users. Works with both immediate and scheduled sends.
            </p>
            <CodeBlock code={sendTargetedCurl} language="bash" />
          </div>

          <hr className="border-slate-100" />

          {/* Full schema */}
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3">Full request schema</p>
            <CodeBlock code={sendFullSchema} language="typescript" />
          </div>
        </CardContent>
      </Card>

      {/* ── Response field reference ───────────────── */}
      <Card>
        <CardHeader><CardTitle>API response reference</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Field</th>
                <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { field: "ok", type: "boolean", desc: "Always true on success" },
                { field: "notificationId", type: "string", desc: "Unique ID — use to look up delivery logs" },
                { field: "queued", type: "number", desc: "Subscribers queued for delivery (0 if scheduled)" },
                { field: "scheduled", type: "boolean", desc: "true if scheduledAt was in the future" },
                { field: "scheduledAt", type: "string | null", desc: "ISO datetime the notification will fire, or null" },
              ].map((row) => (
                <tr key={row.field}>
                  <td className="py-2.5 pr-4"><code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{row.field}</code></td>
                  <td className="py-2.5 pr-4 text-xs text-slate-400 font-mono">{row.type}</td>
                  <td className="py-2.5 text-xs text-slate-500">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── iOS note ──────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>iOS note:</strong> Push works on iOS 16.4+ for installed PWAs only (Add to Home Screen). Users must install first, then grant permission inside the installed app.
      </div>
    </div>
  );
}
