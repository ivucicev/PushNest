import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden } from "@/lib/response";

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
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
  const status = url.searchParams.get("status");

  const where = {
    appId,
    ...(status ? { status: status as "ACTIVE" | "EXPIRED" | "FAILED" | "UNSUBSCRIBED" } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.pushSubscription.findMany({
      where,
      select: {
        id: true, endpoint: true, externalUserId: true, deviceId: true,
        platform: true, browser: true, status: true, createdAt: true, lastSeenAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pushSubscription.count({ where }),
  ]);

  return ok({ items, total, page, limit });
}
