import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isOriginAllowed } from "@/lib/origin";
import { ok, err, notFound } from "@/lib/response";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  externalUserId: z.string().max(200).optional(),
  deviceId: z.string().max(200).optional(),
});

function corsHeaders(origin: string | null, allowed: boolean) {
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`subscribe:${ip}`, 30, 60_000);
  if (!rl.ok) return err("Too many requests", 429);

  const { appId } = await params;
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { id: true, domain: true, allowedOrigins: true, status: true },
  });
  if (!app || app.status !== "ACTIVE") return notFound("App");

  const allowedOriginsList: string[] = JSON.parse(app.allowedOrigins);
  const origin = req.headers.get("origin");
  const originAllowed = isOriginAllowed(origin, app.domain, allowedOriginsList);
  const cors = corsHeaders(origin, originAllowed);

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0].message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const { endpoint, p256dh, auth, externalUserId, deviceId } = parsed.data;

    const ua = req.headers.get("user-agent") ?? "";
    const platform = /iPhone|iPad|iOS/.test(ua) ? "iOS"
      : /Android/.test(ua) ? "Android"
      : /Mac/.test(ua) ? "macOS"
      : /Win/.test(ua) ? "Windows"
      : /Linux/.test(ua) ? "Linux" : null;
    const browser = /Firefox/.test(ua) ? "Firefox"
      : /Edg\//.test(ua) ? "Edge"
      : /Chrome/.test(ua) ? "Chrome"
      : /Safari/.test(ua) ? "Safari" : null;

    const sub = await prisma.pushSubscription.upsert({
      where: { appId_endpoint: { appId, endpoint } },
      create: {
        appId, endpoint, p256dh, auth, externalUserId,
        deviceId: deviceId ?? undefined,
        platform, browser,
        userAgent: ua.slice(0, 500),
        status: "ACTIVE",
        lastSeenAt: new Date(),
      },
      update: {
        p256dh, auth, externalUserId, platform, browser,
        userAgent: ua.slice(0, 500),
        status: "ACTIVE",
        lastSeenAt: new Date(),
      },
      select: { id: true, deviceId: true, status: true, createdAt: true },
    });

    return new Response(JSON.stringify({ ok: true, subscriptionId: sub.id, deviceId: sub.deviceId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { domain: true, allowedOrigins: true },
  });
  const origin = req.headers.get("origin") ?? "*";
  const allowed = app
    ? isOriginAllowed(origin, app.domain, JSON.parse(app.allowedOrigins))
    : false;

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowed ? origin : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
