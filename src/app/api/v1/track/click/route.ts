import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/response";

const schema = z.object({
  notificationId: z.string(),
  subscriptionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Invalid payload");

    const { notificationId, subscriptionId } = parsed.data;
    const now = new Date();

    // Update delivery log click (ignore if already clicked)
    await prisma.deliveryLog.updateMany({
      where: { notificationId, subscriptionId, clicked: false },
      data: { clicked: true, clickedAt: now },
    });

    // Increment notification click counter
    await prisma.notification.updateMany({
      where: { id: notificationId },
      data: { clickCount: { increment: 1 } },
    });

    return ok({ ok: true });
  } catch {
    return err("Internal server error", 500);
  }
}

// Allow cross-origin from any PWA
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
