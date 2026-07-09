import { createHmac } from "crypto";
import { prisma } from "./prisma";

export type WebhookEvent =
  | "notification.sent"
  | "notification.failed"
  | "notification.expired"
  | "notification.scheduled"
  | "notification.cancelled"
  | "subscription.new"
  | "subscription.expired";

export interface WebhookPayload {
  event: WebhookEvent;
  appId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function fireWebhooks(
  appId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: { appId, active: true },
    select: { url: true, secret: true, events: true },
  });

  for (const webhook of webhooks) {
    const subscribedEvents: string[] = JSON.parse(webhook.events);
    if (!subscribedEvents.includes(event)) continue;

    const payload: WebhookPayload = {
      event,
      appId,
      timestamp: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);
    const signature = sign(body, webhook.secret);

    fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PushNest-Event": event,
        "X-PushNest-Signature": `sha256=${signature}`,
        "X-PushNest-Timestamp": payload.timestamp,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {}); // fire and forget — don't block delivery
  }
}
