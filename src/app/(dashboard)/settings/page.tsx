"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name?: string | null; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then(setUser);
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    // TODO: implement PATCH /api/me
    setTimeout(() => { setLoading(false); setSaved(true); }, 500);
  };

  if (!user) return <div className="text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Settings saved.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Name" defaultValue={user.name ?? ""} name="name" />
            <Input label="Email" defaultValue={user.email} name="email" type="email" disabled hint="Email cannot be changed" />
            <Button type="submit" loading={loading}>Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Deleting your account will remove all apps, subscriptions, and delivery logs. This is irreversible.
          </p>
          <Button variant="danger" onClick={() => alert("Contact support to delete your account.")}>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
