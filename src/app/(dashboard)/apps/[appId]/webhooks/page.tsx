"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Trash2, Webhook, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";

const ALL_EVENTS = [
  "notification.sent",
  "notification.failed",
  "notification.expired",
  "notification.scheduled",
  "notification.cancelled",
  "subscription.new",
  "subscription.expired",
] as const;

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export default function WebhooksPage() {
  const params = useParams<{ appId: string }>();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "notification.sent", "notification.failed", "notification.expired",
  ]);
  const [revealedSecret, setRevealedSecret] = useState<{ id: string; secret: string } | null>(null);
  const [error, setError] = useState("");

  const fetchWebhooks = async () => {
    const r = await fetch(`/api/v1/apps/${params.appId}/webhooks`);
    if (r.ok) setWebhooks(await r.json());
    setLoading(false);
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const create = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;
    setCreating(true);
    setError("");
    const r = await fetch(`/api/v1/apps/${params.appId}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, events: selectedEvents }),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error ?? "Failed"); setCreating(false); return; }
    setRevealedSecret({ id: data.id, secret: data.secret });
    setUrl("");
    await fetchWebhooks();
    setCreating(false);
  };

  const toggle = async (webhook: WebhookItem) => {
    await fetch(`/api/v1/apps/${params.appId}/webhooks/${webhook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !webhook.active }),
    });
    setWebhooks((prev) => prev.map((w) => w.id === webhook.id ? { ...w, active: !w.active } : w));
  };

  const del = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/v1/apps/${params.appId}/webhooks/${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    if (revealedSecret?.id === id) setRevealedSecret(null);
  };

  const toggleEvent = (ev: string) =>
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
        <p className="text-sm text-slate-500 mt-1">Receive HTTP POST when delivery events happen.</p>
      </div>

      {revealedSecret && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 mb-1">Copy your webhook secret — shown only once.</p>
              <p className="text-xs text-amber-700 mb-2">Use it to verify the <code className="font-mono">X-PushNest-Signature</code> header.</p>
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs font-mono text-slate-700 break-all">{revealedSecret.secret}</code>
                <CopyButton text={revealedSecret.secret} />
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Add webhook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input
            label="Endpoint URL"
            placeholder="https://yourapp.com/webhooks/pushnest"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
          />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Events</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENTS.map((ev) => (
                <label key={ev} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev)}
                    onChange={() => toggleEvent(ev)}
                    className="rounded text-indigo-600"
                  />
                  <code className="text-xs font-mono">{ev}</code>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={create} loading={creating} disabled={!url.trim() || selectedEvents.length === 0}>
            Add webhook
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Endpoints ({webhooks.length})</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading...</div>
          ) : webhooks.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 flex items-center gap-2">
              <Webhook className="w-4 h-4" /> No webhooks yet.
            </div>
          ) : (
            webhooks.map((w) => (
              <div key={w.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{w.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {w.events.map((ev) => (
                      <span key={ev} className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Created {new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(w)}
                    className={`transition-colors ${w.active ? "text-indigo-600" : "text-slate-300"}`}
                    title={w.active ? "Disable" : "Enable"}
                  >
                    {w.active
                      ? <ToggleRight className="w-6 h-6" />
                      : <ToggleLeft className="w-6 h-6" />
                    }
                  </button>
                  <button
                    onClick={() => del(w.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Verifying signatures</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">
            Every request includes <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">X-PushNest-Signature: sha256=&lt;hmac&gt;</code>. Verify with your webhook secret:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
            <pre>{`// Node.js verification
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
