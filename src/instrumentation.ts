export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prisma } = await import("@/lib/prisma");
    const { processNotificationBatch } = await import("@/lib/queue");
    const { dispatchScheduledNotification } = await import(
      "@/lib/send-notification"
    );

    const POLL_INTERVAL_MS = 5_000;
    let running = false;

    async function poll() {
      if (running) return;
      running = true;
      try {
        const now = new Date();
        const queued = await prisma.notification.findMany({
          where: { status: "QUEUED" },
          select: { id: true },
          take: 10,
          orderBy: { createdAt: "asc" },
        });
        for (const n of queued) await processNotificationBatch(n.id);

        const scheduled = await prisma.notification.findMany({
          where: { status: "SCHEDULED", scheduledAt: { lte: now } },
          select: { id: true },
          take: 10,
          orderBy: { scheduledAt: "asc" },
        });
        for (const n of scheduled) await dispatchScheduledNotification(n.id);
      } catch (err) {
        console.error("[worker] error:", err);
      } finally {
        running = false;
      }
    }

    console.log("[worker] PushNest notification worker started");
    poll();
    setInterval(poll, POLL_INTERVAL_MS);
  }
}
