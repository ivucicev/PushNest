#!/usr/bin/env node
// Applies Prisma migration SQL files using @libsql/client directly.
// Avoids needing @prisma/engines in the runner image.
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
  const url = process.env.DATABASE_URL || "file:./data/pushnest.db";
  const client = createClient({ url });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id                TEXT PRIMARY KEY NOT NULL,
      checksum          TEXT NOT NULL,
      finished_at       DATETIME,
      migration_name    TEXT NOT NULL,
      logs              TEXT,
      rolled_back_at    DATETIME,
      started_at        DATETIME NOT NULL DEFAULT current_timestamp,
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  const { rows } = await client.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
  );
  const applied = new Set(rows.map((r) => r.migration_name));

  const migrationsDir = path.join(__dirname, "prisma", "migrations");
  const dirs = fs.readdirSync(migrationsDir).sort();

  for (const dir of dirs) {
    if (applied.has(dir)) continue;
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;

    const sql = fs.readFileSync(sqlPath, "utf8");
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");

    const stmts = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of stmts) {
      await client.execute(stmt);
    }

    await client.execute({
      sql: `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES (?, ?, ?, datetime('now'), 1)`,
      args: [crypto.randomUUID(), checksum, dir],
    });
    console.log(`[migrate] applied: ${dir}`);
  }

  console.log("[migrate] done");
  await client.close();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
