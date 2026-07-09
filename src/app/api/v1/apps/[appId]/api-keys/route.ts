import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

const schema = z.object({ name: z.string().min(1).max(100) });

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

  const keys = await prisma.apiKey.findMany({
    where: { appId },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(keys);
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
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { raw, hash, prefix } = generateApiKey();
    const key = await prisma.apiKey.create({
      data: { appId, name: parsed.data.name, keyHash: hash, keyPrefix: prefix },
    });

    // Return raw key only once
    return ok(
      { id: key.id, name: key.name, keyPrefix: key.keyPrefix, key: raw, createdAt: key.createdAt },
      201
    );
  } catch {
    return err("Internal server error", 500);
  }
}
