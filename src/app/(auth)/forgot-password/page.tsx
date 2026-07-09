"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devUrl, setDevUrl] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email") }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    if (data.devResetUrl) setDevUrl(data.devResetUrl);
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset password</h1>
        <p className="text-sm text-slate-500 mb-6">Enter your email and we&apos;ll send a reset link.</p>

        {done ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Check your email for a reset link. It expires in 1 hour.</p>
            </div>
            {devUrl && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <p className="font-semibold mb-1">Dev mode — reset link:</p>
                <Link href={devUrl} className="break-all underline text-indigo-600">{devUrl}</Link>
              </div>
            )}
            <Link href="/login" className="block text-center text-sm text-indigo-600 hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
              <Button type="submit" loading={loading} className="w-full" size="lg">Send reset link</Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              <Link href="/login" className="text-indigo-600 hover:underline">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
