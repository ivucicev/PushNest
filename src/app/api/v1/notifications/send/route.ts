import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { sendSchema, createAndSendNotification } from "@/lib/send-notification";
import { rateLimit } from "@/lib/rate-limit";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const key = authHeader?.replace(/^Bearer\s+/i, "");
  if (!key) return json({ error: "Unauthorized" }, 401);

  const apiKey = await validateApiKey(key);
  if (!apiKey) return json({ error: "Unauthorized" }, 401);

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`send:${apiKey.appId}:${ip}`, 100, 60_000);
  if (!rl.ok) return json({ error: "Rate limit exceeded" }, 429);

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

    const { notification, queued, scheduled } = await createAndSendNotification(
      apiKey.appId,
      parsed.data,
      "API"
    );

    return json({
      ok: true,
      notificationId: notification.id,
      queued,
      scheduled: scheduled ?? false,
      scheduledAt: notification.scheduledAt ?? null,
    }, 200);
  } catch (e) {
    console.error("[/api/v1/notifications/send]", e);
    return json({ error: "Internal server error" }, 500);
  }
}
