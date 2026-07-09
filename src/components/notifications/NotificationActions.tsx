"use client";
import { useState } from "react";
import { X, RefreshCw } from "lucide-react";

interface Props {
  notificationId: string;
  appId: string;
  status: string;
  onDone?: () => void;
}

export function NotificationActions({ notificationId, appId, status, onDone }: Props) {
  const [loading, setLoading] = useState<"cancel" | "retry" | null>(null);

  const cancel = async () => {
    if (!confirm("Cancel this scheduled notification?")) return;
    setLoading("cancel");
    await fetch(`/api/v1/apps/${appId}/notifications/${notificationId}/cancel`, { method: "POST" });
    setLoading(null);
    onDone?.();
    window.location.reload();
  };

  const retry = async () => {
    setLoading("retry");
    const r = await fetch(`/api/v1/apps/${appId}/notifications/${notificationId}/retry`, { method: "POST" });
    const data = await r.json();
    setLoading(null);
    if (r.ok) {
      alert(`Retrying ${data.retrying} failed deliveries`);
      window.location.reload();
    } else {
      alert(data.error ?? "Failed");
    }
  };

  return (
    <div className="flex items-center gap-1">
      {status === "SCHEDULED" && (
        <button
          onClick={cancel}
          disabled={loading !== null}
          title="Cancel scheduled notification"
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === "cancel"
            ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full inline-block animate-spin" />
            : <X className="w-3.5 h-3.5" />
          }
        </button>
      )}
      {(status === "FAILED" || status === "SENT") && (
        <button
          onClick={retry}
          disabled={loading !== null}
          title="Retry failed deliveries"
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === "retry"
            ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full inline-block animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />
          }
        </button>
      )}
    </div>
  );
}
