import { NextRequest } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

const VALID_EVENTS = [
  "notification.sent",
  "notification.failed",
  "notification.expired",
  "notification.scheduled",
  "notification.cancelled",
  "subscription.new",
  "subscription.expired",
] as const;

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(VALID_EVENTS)).min(1).default([
    "notification.sent",
    "notification.failed",
    "notification.expired",
  ]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const webhooks = await prisma.webhook.findMany({
    where: { appId },
    select: { id: true, url: true, events: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return ok(webhooks.map((w) => ({ ...w, events: JSON.parse(w.events) })));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    const webhook = await prisma.webhook.create({
      data: {
        appId,
        url: parsed.data.url,
        events: JSON.stringify(parsed.data.events),
        secret,
      },
    });

    // Return secret only on creation
    return ok({
      id: webhook.id,
      url: webhook.url,
      events: parsed.data.events,
      active: webhook.active,
      secret,
      createdAt: webhook.createdAt,
    }, 201);
  } catch {
    return err("Internal server error", 500);
  }
}
