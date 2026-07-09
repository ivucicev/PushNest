import Link from "next/link";
import {
  Zap, Code, BarChart2, Shield, Bell, Globe,
  UserPlus, Send, CheckCircle, Clock, ArrowRight,
  Layers, Activity,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ─── Nav ─────────────────────────────────────────────── */}
      <nav className="border-b border-slate-200 sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">PushNest</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600 font-medium">
            <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</Link>
            <Link href="#features" className="hover:text-slate-900 transition-colors">Features</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5">
              Log in
            </Link>
            <Link href="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-20 pb-0">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              PWA &amp; Web Push · iOS · Android · Desktop
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto">
            Push notifications<br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              without the server
            </span>
          </h1>
          <p className="text-center text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Register browsers, send via API or dashboard, schedule campaigns, track every delivery.
            One platform, zero infrastructure.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-base shadow-lg shadow-indigo-200">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#how-it-works" className="inline-flex items-center gap-2 text-slate-700 font-semibold px-5 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-base border border-slate-200">
              See how it works
            </Link>
          </div>

          {/* Dashboard preview card */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-400 font-mono">
                app.pushnest.dev/apps/my-app/send
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="flex divide-x divide-slate-100">
              {/* Sidebar mock */}
              <div className="w-44 bg-slate-50 p-3 space-y-1 shrink-0">
                {[
                  { label: "Overview", active: false },
                  { label: "Send", active: true },
                  { label: "Campaigns", active: false },
                  { label: "Subscribers", active: false },
                  { label: "Delivery Logs", active: false },
                  { label: "Integration", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      item.active ? "bg-indigo-50 text-indigo-700" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content mock */}
              <div className="flex-1 p-6 space-y-4">
                <div>
                  <div className="text-sm font-bold text-slate-800 mb-0.5">Send Notification</div>
                  <div className="text-xs text-slate-400">Send now or schedule for later</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Left: form mock */}
                  <div className="space-y-2">
                    <div className="h-7 bg-slate-100 rounded-lg" />
                    <div className="h-14 bg-slate-100 rounded-lg" />
                    <div className="h-7 bg-slate-100 rounded-lg" />
                    <div className="flex gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        </div>
                        <span className="text-xs text-slate-500">Send now</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                        <span className="text-xs text-slate-400">Schedule</span>
                      </div>
                    </div>
                    <div className="h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">Send now</span>
                    </div>
                  </div>

                  {/* Right: mock notification + stats */}
                  <div className="space-y-3">
                    {/* Mock push notification */}
                    <div className="bg-slate-900 rounded-xl p-3 flex gap-2.5 items-start">
                      <div className="w-7 h-7 bg-indigo-500 rounded-lg shrink-0 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">New feature shipped 🚀</p>
                        <p className="text-xs text-slate-400 mt-0.5">Dark mode is now available in settings</p>
                      </div>
                    </div>
                    {/* Mock stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Subscribers", value: "1,284" },
                        { label: "Sent today", value: "342" },
                        { label: "Success", value: "99.1%" },
                      ].map((s) => (
                        <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-slate-800">{s.value}</p>
                          <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Mock delivery logs */}
                    <div className="space-y-1">
                      {[
                        { browser: "Chrome / macOS", status: "SENT", color: "text-green-600 bg-green-50" },
                        { browser: "Safari / iOS", status: "SENT", color: "text-green-600 bg-green-50" },
                        { browser: "Firefox / Win", status: "SENT", color: "text-green-600 bg-green-50" },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{log.browser}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.color}`}>{log.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos / social proof ────────────────────────────── */}
      <section className="py-12 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">Works with every web stack</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-300 font-bold text-sm tracking-wide">
            {["Next.js", "React", "Vue", "Svelte", "Nuxt", "Astro", "Remix", "Vanilla JS"].map((f) => (
              <span key={f} className="text-slate-400">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-xs font-bold text-indigo-500 tracking-widest uppercase">How it works</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3 mb-4">From zero to push in 4 steps</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              No VAPID key management, no push server, no delivery code. PushNest handles all of it.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-indigo-300 via-indigo-200 to-indigo-100 hidden md:block" />

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="relative flex gap-8 items-start">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 z-10">
                  <UserPlus className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-full">Step 1</span>
                    <h3 className="text-xl font-bold text-slate-900">Create an account & register your app</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed mb-5">
                    Sign up and add your web app in under a minute. PushNest generates VAPID keys, a public app ID, and an API key automatically — nothing to configure.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["VAPID keys auto-generated", "API key ready instantly", "Per-app isolation"].map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex gap-8 items-start">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 z-10">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-full">Step 2</span>
                    <h3 className="text-xl font-bold text-slate-900">Add two snippets to your frontend</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed mb-5">
                    Copy the service worker and subscribe snippet from your integration page. Asks users for permission and registers their browser with PushNest.
                  </p>
                  <div className="bg-slate-900 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                      <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                      <span className="text-slate-500 text-xs ml-2 font-mono">subscribe.js</span>
                    </div>
                    <pre className="p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">{`const reg = await navigator.serviceWorker.register('/push-sw.js');
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY',
});
const { endpoint, keys } = sub.toJSON();
await fetch('/api/v1/apps/APP_ID/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
});`}</pre>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex gap-8 items-start">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 z-10">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-full">Step 3</span>
                    <h3 className="text-xl font-bold text-slate-900">Send now or schedule for later</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed mb-5">
                    One POST sends to everyone. Target by user ID or subscription. Add <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">scheduledAt</code> to fire at a specific time. API responds instantly — delivery is async.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-slate-500 text-xs font-mono">send now</span>
                      </div>
                      <pre className="p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">{`curl -X POST /api/v1/send \\
  -H "Authorization: Bearer KEY" \\
  -d '{
    "title": "New feature!",
    "body": "Check it out"
  }'`}</pre>
                    </div>
                    <div className="bg-slate-900 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-700 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-500 text-xs font-mono">schedule for later</span>
                      </div>
                      <pre className="p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">{`curl -X POST /api/v1/send \\
  -H "Authorization: Bearer KEY" \\
  -d '{
    "title": "Weekly digest",
    "scheduledAt": "2025-01-15T09:00:00Z"
  }'`}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex gap-8 items-start">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 z-10">
                  <BarChart2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-full">Step 4</span>
                    <h3 className="text-xl font-bold text-slate-900">Track every delivery</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed mb-6">
                    Every attempt is logged — status code, error message, browser, platform. Expired subscriptions auto-removed on 404/410 from the push provider.
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: "SCHEDULED", color: "text-blue-600 bg-blue-50 border-blue-100", desc: "Queued for later" },
                      { value: "SENT", color: "text-green-600 bg-green-50 border-green-100", desc: "Delivered" },
                      { value: "FAILED", color: "text-red-600 bg-red-50 border-red-100", desc: "Rejected" },
                      { value: "EXPIRED", color: "text-amber-600 bg-amber-50 border-amber-100", desc: "Auto-removed" },
                    ].map((s) => (
                      <div key={s.value} className={`border rounded-xl p-3 text-center ${s.color}`}>
                        <p className="text-xs font-bold tracking-wide">{s.value}</p>
                        <p className="text-xs opacity-70 mt-1">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-500 tracking-widest uppercase">Features</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3 mb-4">Everything included</h2>
            <p className="text-slate-500 text-lg">No hidden extras. No separate push server to run.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Code,
                title: "Simple REST API",
                desc: "One endpoint to subscribe, one to send. Bearer token auth, JSON in and out. Works from any backend.",
                new: false,
              },
              {
                icon: Clock,
                title: "Scheduled Notifications",
                desc: "Pass scheduledAt to fire at a specific time. Dashboard picker or raw ISO 8601 — worker dispatches automatically.",
                new: true,
              },
              {
                icon: Bell,
                title: "Campaign Dashboard",
                desc: "Send to all subscribers or target by external user ID. No code required — just fill the form and send.",
                new: false,
              },
              {
                icon: Activity,
                title: "Delivery Logs",
                desc: "Every attempt logged with status, status code, error message, browser, and platform.",
                new: false,
              },
              {
                icon: Globe,
                title: "Cross-platform",
                desc: "iOS 16.4+ PWAs, Android, macOS, Windows. Chrome, Firefox, Edge, Safari — all supported.",
                new: false,
              },
              {
                icon: Layers,
                title: "Multi-app support",
                desc: "One account, unlimited apps. Each gets isolated VAPID keys, API keys, subscribers, and logs.",
                new: false,
              },
              {
                icon: Shield,
                title: "Secure by default",
                desc: "API keys hashed with SHA-256, shown once. Origin validation on subscribe. Rate limiting built in.",
                new: false,
              },
              {
                icon: Zap,
                title: "Async delivery",
                desc: "API responds instantly after queuing. Worker delivers in the background — no waiting on slow push providers.",
                new: false,
              },
              {
                icon: CheckCircle,
                title: "Auto-expire cleanup",
                desc: "Subscriptions automatically marked expired when push providers return 404 or 410. List stays clean.",
                new: false,
              },
            ].map((f) => (
              <div key={f.title} className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all">
                {f.new && (
                  <span className="absolute top-4 right-4 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-violet-700 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-black text-white mb-4">Send your first push in 10 minutes</h2>
          <p className="text-indigo-200 mb-10 text-lg leading-relaxed">
            Create an account, register your app, copy the snippet, hit send. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors text-base shadow-xl"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-indigo-200 hover:text-white font-semibold px-5 py-4 transition-colors text-base"
            >
              Log in →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800">PushNest</span>
            <span className="text-slate-300 mx-2">·</span>
            <span className="text-sm text-slate-400">PWA &amp; Web Push infrastructure</span>
          </div>
          <p className="text-sm text-slate-400">© 2025 PushNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
