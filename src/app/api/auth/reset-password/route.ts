import { NextRequest } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/auth";
import { ok, err } from "@/lib/response";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { token, password } = parsed.data;
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) return err("Invalid or expired reset link", 400);
    if (resetToken.usedAt) return err("Reset link already used", 400);
    if (resetToken.expiresAt < new Date()) return err("Reset link expired", 400);

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await setSession({
      id: resetToken.user.id,
      email: resetToken.user.email,
      name: resetToken.user.name,
    });

    return ok({ ok: true });
  } catch {
    return err("Internal server error", 500);
  }
}
