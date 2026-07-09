import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

async function getOwnedApp(appId: string, userId: string) {
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app || app.userId !== userId) return null;
  return app;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: {
      _count: {
        select: {
          subscriptions: { where: { status: "ACTIVE" } },
          notifications: true,
          campaigns: true,
        },
      },
    },
  });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const { vapidPrivateKey: _, ...safe } = app;
  void _;
  return ok({ ...safe, allowedOrigins: JSON.parse(safe.allowedOrigins) });
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().url().optional(),
  allowedOrigins: z.array(z.string()).optional(),
  iconUrl: z.string().url().nullable().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await getOwnedApp(appId, session.id);
  if (!app) return notFound("App");

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { allowedOrigins, ...rest } = parsed.data;
    const updated = await prisma.app.update({
      where: { id: appId },
      data: {
        ...rest,
        ...(allowedOrigins !== undefined ? { allowedOrigins: JSON.stringify(allowedOrigins) } : {}),
      },
      select: {
        id: true, name: true, iconUrl: true, domain: true,
        allowedOrigins: true, vapidPublicKey: true, vapidSubject: true,
        status: true, createdAt: true, updatedAt: true,
      },
    });
    return ok({ ...updated, allowedOrigins: JSON.parse(updated.allowedOrigins) });
  } catch {
    return err("Internal server error", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await getOwnedApp(appId, session.id);
  if (!app) return notFound("App");

  await prisma.app.delete({ where: { id: appId } });
  return ok({ ok: true });
}
