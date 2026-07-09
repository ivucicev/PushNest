import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PushNest — Push notifications without the infrastructure",
  description: "Send PWA push notifications with a simple API, hosted delivery, campaign tools, and delivery logs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
