// Public endpoint — no auth, just needs endpoint match within the app
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/response";
import { isOriginAllowed } from "@/lib/origin";

const schema = z.object({
  endpoint: z.string().url(),
});

function corsHeaders(origin: string | null, allowed: boolean) {
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "",
    "Access-Control-Allow-Methods": "DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  return handleUnsubscribe(req, await params);
}

// POST alias for browsers that can't send DELETE with body
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  return handleUnsubscribe(req, await params);
}

async function handleUnsubscribe(req: NextRequest, { appId }: { appId: string }) {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { domain: true, allowedOrigins: true, status: true },
  });
  if (!app || app.status !== "ACTIVE") return notFound("App");

  const origin = req.headers.get("origin");
  const originAllowed = isOriginAllowed(origin, app.domain, JSON.parse(app.allowedOrigins));
  const cors = corsHeaders(origin, originAllowed);

  if (!originAllowed) {
    return jsonResponse({ error: "Origin not allowed" }, 403, cors);
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0].message }, 400, cors);

    const sub = await prisma.pushSubscription.findFirst({
      where: { appId, endpoint: parsed.data.endpoint },
    });
    if (!sub) return jsonResponse({ ok: true }, 200, cors);

    await prisma.pushSubscription.update({
      where: { id: sub.id },
      data: { status: "UNSUBSCRIBED" },
    });

    return jsonResponse({ ok: true }, 200, cors);
  } catch {
    return jsonResponse({ error: "Internal server error" }, 500, cors);
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
      "Access-Control-Allow-Methods": "DELETE, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
