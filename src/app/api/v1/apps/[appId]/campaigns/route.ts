import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().url().optional(),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  tag: z.string().max(100).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  audience: z.object({
    externalUserIds: z.array(z.string()).optional(),
    subscriptionIds: z.array(z.string()).optional(),
    all: z.boolean().optional(),
  }).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "20"));

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where: { appId },
      select: {
        id: true, title: true, body: true, url: true, icon: true,
        status: true, sentAt: true, createdAt: true, updatedAt: true,
        _count: { select: { notifications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where: { appId } }),
  ]);

  return ok({ items, total, page, limit });
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

    const { data, audience, ...rest } = parsed.data;
    const campaign = await prisma.campaign.create({
      data: {
        appId,
        ...rest,
        data: data ? JSON.stringify(data) : null,
        audience: audience ? JSON.stringify(audience) : null,
      },
    });
    return ok(campaign, 201);
  } catch {
    return err("Internal server error", 500);
  }
}
