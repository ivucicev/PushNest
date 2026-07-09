"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origins, setOrigins] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const allowedOrigins = origins.split("\n").map((s) => s.trim()).filter(Boolean);

    const res = await fetch("/api/v1/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        domain: fd.get("domain"),
        iconUrl: fd.get("iconUrl") || undefined,
        allowedOrigins,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create app");
      setLoading(false);
      return;
    }
    router.push(`/apps/${data.id}/integration`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link href="/apps" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to apps
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create new app</h1>
        <p className="text-sm text-slate-500 mt-1">
          PushNest will generate VAPID keys for your app automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              label="App name"
              placeholder="My Web App"
              required
            />
            <Input
              name="domain"
              label="App domain"
              type="url"
              placeholder="https://myapp.com"
              hint="The primary URL of your app (used for origin validation)"
              required
            />
            <Input
              name="iconUrl"
              label="Icon URL (optional)"
              type="url"
              placeholder="https://myapp.com/icon-192.png"
              hint="Shown in push notifications (192×192px PNG recommended)"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Allowed origins (optional)
              </label>
              <textarea
                value={origins}
                onChange={(e) => setOrigins(e.target.value)}
                placeholder={"https://myapp.com\nhttps://staging.myapp.com"}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500">
                One origin per line. If empty, only the domain above is allowed.
              </p>
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full">
              Create app
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
