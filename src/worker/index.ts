import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { processNotificationBatch } from "../lib/queue";
import { dispatchScheduledNotification } from "../lib/send-notification";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

const POLL_INTERVAL_MS = 5_000;
let running = false;

async function poll() {
  if (running) return;
  running = true;
  try {
    const now = new Date();

    // Process queued notifications
    const queued = await prisma.notification.findMany({
      where: { status: "QUEUED" },
      select: { id: true },
      take: 10,
      orderBy: { createdAt: "asc" },
    });
    for (const n of queued) {
      await processNotificationBatch(n.id);
    }

    // Dispatch scheduled notifications that are now due (skip CANCELLED)
    const scheduled = await prisma.notification.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: now } },
      select: { id: true },
      take: 10,
      orderBy: { scheduledAt: "asc" },
    });
    for (const n of scheduled) {
      await dispatchScheduledNotification(n.id);
    }
  } catch (err) {
    console.error("[worker] error:", err);
  } finally {
    running = false;
  }
}

console.log("[worker] PushNest notification worker started");
poll();
const interval = setInterval(poll, POLL_INTERVAL_MS);

process.on("SIGTERM", () => { clearInterval(interval); prisma.$disconnect(); process.exit(0); });
process.on("SIGINT", () => { clearInterval(interval); prisma.$disconnect(); process.exit(0); });
