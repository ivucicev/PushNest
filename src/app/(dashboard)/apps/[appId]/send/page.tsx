"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, Clock } from "lucide-react";

export default function SendPage() {
  const params = useParams<{ appId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ notificationId: string; queued: number; scheduled?: boolean; scheduledAt?: string } | null>(null);
  const [audience, setAudience] = useState<"all" | "userIds">("all");
  const [userIds, setUserIds] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const fd = new FormData(e.currentTarget);

    if (scheduleMode === "later" && !scheduledAt) {
      setError("Pick a date and time to schedule");
      setLoading(false);
      return;
    }
    if (scheduleMode === "later" && new Date(scheduledAt) <= new Date()) {
      setError("Scheduled time must be in the future");
      setLoading(false);
      return;
    }

    const body: Record<string, unknown> = {
      title: fd.get("title"),
      body: fd.get("body") || undefined,
      url: fd.get("url") || undefined,
      icon: fd.get("icon") || undefined,
      tag: fd.get("tag") || undefined,
      ...(scheduleMode === "later" ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    };

    if (audience === "userIds" && userIds.trim()) {
      body.audience = {
        externalUserIds: userIds.split("\n").map((s) => s.trim()).filter(Boolean),
      };
    }

    const res = await fetch(`/api/v1/apps/${params.appId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create");
      setLoading(false);
      return;
    }
    const campaign = await res.json();

    const sendRes = await fetch(`/api/v1/apps/${params.appId}/campaigns/${campaign.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: scheduleMode === "later" ? new Date(scheduledAt).toISOString() : undefined }),
    });
    const sendData = await sendRes.json();
    if (!sendRes.ok) {
      setError(sendData.error ?? "Failed to send");
      setLoading(false);
      return;
    }

    setResult({
      notificationId: sendData.notificationId,
      queued: sendData.queued,
      scheduled: sendData.scheduled,
      scheduledAt: scheduleMode === "later" ? scheduledAt : undefined,
    });
    setLoading(false);
  };

  // Min datetime: now + 1 minute (browser local time)
  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Send Notification</h1>
        <p className="text-sm text-slate-500 mt-1">Send now or schedule for later.</p>
      </div>

      {result && (
        <div className={`p-4 border rounded-xl flex items-start gap-3 ${result.scheduled ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
          {result.scheduled
            ? <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            : <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${result.scheduled ? "text-blue-800" : "text-green-800"}`}>
              {result.scheduled ? "Notification scheduled!" : "Notification queued!"}
            </p>
            <p className={`text-sm ${result.scheduled ? "text-blue-700" : "text-green-700"}`}>
              {result.scheduled
                ? `Will send at ${new Date(result.scheduledAt!).toLocaleString()}`
                : `Sending to ${result.queued} subscriber${result.queued !== 1 ? "s" : ""}`
              }
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono">{result.notificationId}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Notification content</CardTitle></CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" label="Title" placeholder="New update available!" required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Body</label>
              <textarea
                name="body"
                placeholder="A short description..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <Input name="url" type="url" label="Click URL" placeholder="https://yourapp.com/page" />
            <Input name="icon" type="url" label="Icon URL (optional)" placeholder="https://yourapp.com/icon.png" />
            <Input name="tag" label="Tag (optional)" placeholder="update" hint="Same tag replaces previous notification with same tag" />

            {/* Audience */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Audience</p>
              <div className="flex gap-4">
                {(["all", "userIds"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="audience_type"
                      value={opt}
                      checked={audience === opt}
                      onChange={() => setAudience(opt)}
                      className="text-indigo-600"
                    />
                    {opt === "all" ? "All active subscribers" : "Specific user IDs"}
                  </label>
                ))}
              </div>
              {audience === "userIds" && (
                <div className="mt-3">
                  <textarea
                    value={userIds}
                    onChange={(e) => setUserIds(e.target.value)}
                    placeholder={"user_123\nuser_456"}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">One external user ID per line</p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">When to send</p>
              <div className="flex gap-4 mb-3">
                {(["now", "later"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="schedule_type"
                      value={opt}
                      checked={scheduleMode === opt}
                      onChange={() => setScheduleMode(opt)}
                      className="text-indigo-600"
                    />
                    {opt === "now" ? "Send immediately" : "Schedule for later"}
                  </label>
                ))}
              </div>
              {scheduleMode === "later" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Date & time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      min={minDateTime}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={scheduleMode === "later"}
                    />
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 space-y-0.5">
                    <p><span className="font-medium">Timezone:</span> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                    {scheduledAt && (
                      <p><span className="font-medium">UTC:</span> {new Date(scheduledAt).toISOString()}</p>
                    )}
                    <p className="text-slate-400">Time is converted to UTC automatically. The worker fires within 5 seconds of the scheduled time.</p>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {scheduleMode === "later" ? (
                <><Clock className="w-4 h-4" /> Schedule notification</>
              ) : "Send now"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
