import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, forbidden } from "@/lib/response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string; keyId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, keyId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const key = await prisma.apiKey.findFirst({ where: { id: keyId, appId } });
  if (!key) return notFound("API key");

  await prisma.apiKey.delete({ where: { id: keyId } });
  return ok({ ok: true });
}
