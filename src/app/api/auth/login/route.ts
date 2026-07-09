import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSession } from "@/lib/auth";
import { ok, err } from "@/lib/response";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`login:${ip}`, 10, 60_000);
  if (!rl.ok) return err("Too many login attempts. Try again later.", 429);

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Invalid credentials");

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return err("Invalid credentials", 401);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return err("Invalid credentials", 401);

    await setSession({ id: user.id, email: user.email, name: user.name });
    return ok({ id: user.id, email: user.email, name: user.name });
  } catch {
    return err("Internal server error", 500);
  }
}
