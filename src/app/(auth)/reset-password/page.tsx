"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;
    if (password !== confirm) { setError("Passwords don't match"); setLoading(false); return; }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  };

  if (!token) return (
    <div className="text-center text-sm text-slate-500">
      Invalid link. <Link href="/forgot-password" className="text-indigo-600 hover:underline">Request a new one.</Link>
    </div>
  );

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Set new password</h1>
        <p className="text-sm text-slate-500 mb-6">Choose a password with at least 8 characters.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="password" type="password" label="New password" placeholder="Minimum 8 characters" required />
          <Input name="confirm" type="password" label="Confirm password" placeholder="Repeat password" required />
          <Button type="submit" loading={loading} className="w-full" size="lg">Set password</Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
