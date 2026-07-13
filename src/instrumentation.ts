import fs from "fs";
import path from "path";
import crypto from "crypto";

async function runMigrations() {
  const { createClient } = await import("@libsql/client");
  const url = process.env.DATABASE_URL ?? "file:///app/data/pushnest.db";
  const client = createClient({ url });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      checksum TEXT NOT NULL,
      finished_at DATETIME,
      migration_name TEXT NOT NULL,
      logs TEXT,
      rolled_back_at DATETIME,
      started_at DATETIME NOT NULL DEFAULT current_timestamp,
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  const { rows } = await client.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
  );
  const applied = new Set(rows.map((r) => String(r.migration_name)));

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const dirs = fs.readdirSync(migrationsDir).sort();

  for (const dir of dirs) {
    if (applied.has(dir)) continue;
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, "utf8");
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    const stmts = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    for (const stmt of stmts) await client.execute(stmt);
    await client.execute({
      sql: `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES (?, ?, ?, datetime('now'), 1)`,
      args: [crypto.randomUUID(), checksum, dir],
    });
    console.log(`[migrate] applied: ${dir}`);
  }

  await client.close();
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await runMigrations();

    const { prisma } = await import("@/lib/prisma");
    const { processNotificationBatch } = await import("@/lib/queue");
    const { dispatchScheduledNotification } = await import("@/lib/send-notification");

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
