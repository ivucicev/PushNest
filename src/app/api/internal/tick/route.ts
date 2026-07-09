// Internal scheduler tick — called by a setInterval in lib/scheduler.ts on app startup.
// Processes scheduled notifications that are now due.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchScheduledNotification } from "@/lib/send-notification";
import { ok, err } from "@/lib/response";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_SECRET && process.env.NODE_ENV === "production") {
    return err("Forbidden", 403);
  }

  const now = new Date();
  const scheduled = await prisma.notification.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    select: { id: true },
    take: 20,
    orderBy: { scheduledAt: "asc" },
  });

  for (const n of scheduled) {
    await dispatchScheduledNotification(n.id);
  }

  return ok({ processed: scheduled.length });
}
