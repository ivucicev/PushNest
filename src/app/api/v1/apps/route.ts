import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVapidKeys } from "@/lib/webpush";
import { ok, err, unauthorized } from "@/lib/response";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().url(),
  allowedOrigins: z.array(z.string()).default([]),
  iconUrl: z.string().url().optional(),
  vapidSubject: z.string().email().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const apps = await prisma.app.findMany({
    where: { userId: session.id },
    select: {
      id: true,
      name: true,
      iconUrl: true,
      domain: true,
      allowedOrigins: true,
      vapidPublicKey: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          subscriptions: { where: { status: "ACTIVE" } },
          notifications: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(apps.map((a) => ({
    ...a,
    allowedOrigins: JSON.parse(a.allowedOrigins),
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { name, domain, allowedOrigins, iconUrl, vapidSubject } = parsed.data;
    const vapid = generateVapidKeys();
    const subject = vapidSubject ?? `mailto:${session.email}`;

    const app = await prisma.app.create({
      data: {
        userId: session.id,
        name,
        domain,
        allowedOrigins: JSON.stringify(allowedOrigins),
        iconUrl,
        vapidPublicKey: vapid.publicKey,
        vapidPrivateKey: vapid.privateKey,
        vapidSubject: subject,
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        domain: true,
        allowedOrigins: true,
        vapidPublicKey: true,
        vapidSubject: true,
        status: true,
        createdAt: true,
      },
    });

    return ok({ ...app, allowedOrigins: JSON.parse(app.allowedOrigins) }, 201);
  } catch {
    return err("Internal server error", 500);
  }
}
