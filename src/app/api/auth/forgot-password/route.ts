import { NextRequest } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/response";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`forgot:${ip}`, 5, 60_000);
  if (!rl.ok) return err("Too many requests", 429);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    // Always return success to avoid email enumeration
    if (!user) return ok({ ok: true, message: "If that email exists, a reset link was sent." });

    // Invalidate old tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const raw = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${raw}`;

    // In production, send email. For now return the URL (dev mode only).
    const isDev = process.env.NODE_ENV !== "production";
    return ok({
      ok: true,
      message: "If that email exists, a reset link was sent.",
      ...(isDev ? { devResetUrl: resetUrl } : {}),
    });
  } catch {
    return err("Internal server error", 500);
  }
}
