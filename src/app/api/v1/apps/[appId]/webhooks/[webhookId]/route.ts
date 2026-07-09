import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

const updateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; webhookId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, webhookId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, appId } });
  if (!webhook) return notFound("Webhook");

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { events, ...rest } = parsed.data;
    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...rest,
        ...(events ? { events: JSON.stringify(events) } : {}),
      },
      select: { id: true, url: true, events: true, active: true, updatedAt: true },
    });
    return ok({ ...updated, events: JSON.parse(updated.events) });
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string; webhookId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, webhookId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, appId } });
  if (!webhook) return notFound("Webhook");

  await prisma.webhook.delete({ where: { id: webhookId } });
  return ok({ ok: true });
}
