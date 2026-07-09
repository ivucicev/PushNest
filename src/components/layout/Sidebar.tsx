"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Zap, Settings, ChevronLeft, ChevronRight,
  Bell, Users, BarChart2, Code, List, Send, Webhook, KeyRound,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/apps", label: "Apps", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppNavProps {
  appId: string;
  appName: string;
}

export function AppSidebar({ appId, appName }: AppNavProps) {
  const pathname = usePathname();
  const base = `/apps/${appId}`;

  const appNav = [
    { href: base, label: "Overview", icon: BarChart2 },
    { href: `${base}/send`, label: "Send", icon: Send },
    { href: `${base}/campaigns`, label: "Campaigns", icon: Bell },
    { href: `${base}/subscriptions`, label: "Subscribers", icon: Users },
    { href: `${base}/logs`, label: "Delivery Logs", icon: List },
    { href: `${base}/webhooks`, label: "Webhooks", icon: Webhook },
    { href: `${base}/api-keys`, label: "API Keys", icon: KeyRound },
    { href: `${base}/integration`, label: "Integration", icon: Code },
  ];

  return (
    <div className="w-56 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col min-h-screen">
      <div className="p-4 border-b border-slate-200">
        <Link href="/apps" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> All Apps
        </Link>
        <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{appName}</p>
      </div>
      <nav className="p-3 flex flex-col gap-1 flex-1">
        {appNav.map((item) => {
          const active = item.href === base
            ? pathname === base
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={clsx(
        "shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col min-h-screen transition-all",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">PushNest</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="p-3 flex flex-col gap-1 flex-1">
        {mainNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
