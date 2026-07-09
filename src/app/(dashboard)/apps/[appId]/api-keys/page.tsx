"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Trash2, Key, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const params = useParams<{ appId: string }>();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null);
  const [error, setError] = useState("");

  const fetchKeys = async () => {
    const r = await fetch(`/api/v1/apps/${params.appId}/api-keys`);
    if (r.ok) setKeys(await r.json());
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError("");
    const r = await fetch(`/api/v1/apps/${params.appId}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error ?? "Failed"); setCreating(false); return; }
    setRevealedKey({ id: data.id, key: data.key });
    setNewKeyName("");
    await fetchKeys();
    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    await fetch(`/api/v1/apps/${params.appId}/api-keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
    if (revealedKey?.id === id) setRevealedKey(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
        <p className="text-sm text-slate-500 mt-1">Manage API keys for this app.</p>
      </div>

      {revealedKey && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Copy this key now — it will never be shown again.
              </p>
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs font-mono text-slate-700 break-all">{revealedKey.key}</code>
                <CopyButton text={revealedKey.key} />
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Create new key</CardTitle></CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. Production key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createKey()}
              />
            </div>
            <Button onClick={createKey} loading={creating} disabled={!newKeyName.trim()}>
              Create key
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Keys ({keys.length})</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4" /> No API keys yet.
            </div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{k.name}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {k.keyPrefix}••••••••••••••••••••
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {k.lastUsedAt ? `Used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "Never used"}
                    </p>
                    <p className="text-xs text-slate-300">Created {new Date(k.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
