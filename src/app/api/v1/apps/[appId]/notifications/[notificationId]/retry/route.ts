import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processNotificationBatch } from "@/lib/queue";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string; notificationId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, notificationId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, appId },
  });
  if (!notification) return notFound("Notification");
  if (!["FAILED", "SENT"].includes(notification.status)) {
    return err(`No failed deliveries to retry on status ${notification.status}`, 400);
  }

  // Find failed/expired logs (not 404/410 — those subs are dead)
  const failedLogs = await prisma.deliveryLog.findMany({
    where: { notificationId, status: "FAILED" },
    select: { id: true, subscriptionId: true },
  });

  if (failedLogs.length === 0) return err("No retryable deliveries found", 400);

  // Re-queue failed logs
  await prisma.deliveryLog.updateMany({
    where: { id: { in: failedLogs.map((l) => l.id) } },
    data: { status: "QUEUED", errorMessage: null, statusCode: null, sentAt: null },
  });

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "QUEUED",
      failedCount: { decrement: failedLogs.length },
      updatedAt: new Date(),
    },
  });

  setImmediate(() => {
    processNotificationBatch(notificationId).catch(console.error);
  });

  return ok({ ok: true, retrying: failedLogs.length });
}
