import { z } from "zod";
import { prisma } from "./prisma";
import { processNotificationBatch } from "./queue";

export const audienceSchema = z.object({
  externalUserIds: z.array(z.string()).optional(),
  subscriptionIds: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export const sendSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(500).optional(),
  url: z.string().url().optional(),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  tag: z.string().max(100).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  scheduledAt: z.string().datetime().optional(),
  audience: audienceSchema.optional(),
});

export type SendInput = z.infer<typeof sendSchema>;

async function resolveSubscriptionIds(
  appId: string,
  audience?: SendInput["audience"]
): Promise<string[]> {
  if (audience?.subscriptionIds?.length) {
    const subs = await prisma.pushSubscription.findMany({
      where: { appId, status: "ACTIVE", id: { in: audience.subscriptionIds } },
      select: { id: true },
    });
    return subs.map((s) => s.id);
  }
  if (audience?.externalUserIds?.length) {
    const subs = await prisma.pushSubscription.findMany({
      where: { appId, status: "ACTIVE", externalUserId: { in: audience.externalUserIds } },
      select: { id: true },
    });
    return subs.map((s) => s.id);
  }
  const subs = await prisma.pushSubscription.findMany({
    where: { appId, status: "ACTIVE" },
    select: { id: true },
  });
  return subs.map((s) => s.id);
}

export async function createAndSendNotification(
  appId: string,
  input: SendInput,
  source: "API" | "DASHBOARD",
  campaignId?: string
) {
  const { title, body, url, icon, badge, tag, data, audience, scheduledAt } = input;

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
  const isScheduled = scheduledDate !== null && scheduledDate > new Date();

  // Pack audience + user data together in the data field for scheduled sends
  const payload = {
    ...(data ?? {}),
    ...(isScheduled && audience ? { __audience: audience } : {}),
  };
  const dataStr = Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;

  if (isScheduled) {
    const notification = await prisma.notification.create({
      data: {
        appId, campaignId, title, body, url, icon, badge, tag,
        data: dataStr,
        source,
        status: "SCHEDULED",
        scheduledAt: scheduledDate,
        totalCount: 0,
      },
    });
    return { notification, queued: 0, scheduled: true };
  }

  const subscriptionIds = await resolveSubscriptionIds(appId, audience);
  const immediateDataStr = data && Object.keys(data).length > 0 ? JSON.stringify(data) : null;

  if (subscriptionIds.length === 0) {
    const notification = await prisma.notification.create({
      data: { appId, campaignId, title, body, url, icon, badge, tag, data: immediateDataStr, source, status: "SENT", totalCount: 0 },
    });
    return { notification, queued: 0, scheduled: false };
  }

  const notification = await prisma.notification.create({
    data: {
      appId, campaignId, title, body, url, icon, badge, tag,
      data: immediateDataStr,
      source, status: "QUEUED", totalCount: subscriptionIds.length,
      deliveryLogs: {
        createMany: {
          data: subscriptionIds.map((subscriptionId) => ({
            appId, subscriptionId, status: "QUEUED" as const,
          })),
        },
      },
    },
  });

  setImmediate(() => {
    processNotificationBatch(notification.id).catch(console.error);
  });

  return { notification, queued: subscriptionIds.length, scheduled: false };
}

export async function dispatchScheduledNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      id: true, appId: true, campaignId: true, title: true, body: true,
      url: true, icon: true, badge: true, tag: true, data: true, source: true,
    },
  });
  if (!notification) return;

  // Skip if cancelled between schedule time and now
  const current = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { status: true },
  });
  if (current?.status === "CANCELLED") return;

  // Extract audience from packed data field
  let audience: SendInput["audience"] | undefined;
  let cleanDataStr: string | null = notification.data;

  if (notification.data) {
    try {
      const parsed = JSON.parse(notification.data) as Record<string, unknown>;
      if (parsed.__audience) {
        audience = parsed.__audience as SendInput["audience"];
        const { __audience: _, ...rest } = parsed;
        cleanDataStr = Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;
      }
    } catch { /* leave cleanDataStr as-is */ }
  }

  const subscriptionIds = await resolveSubscriptionIds(notification.appId, audience);

  if (subscriptionIds.length === 0) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "SENT", totalCount: 0, data: cleanDataStr, updatedAt: new Date() },
    });
    return;
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "QUEUED",
      totalCount: subscriptionIds.length,
      data: cleanDataStr,
      updatedAt: new Date(),
      deliveryLogs: {
        createMany: {
          data: subscriptionIds.map((subscriptionId) => ({
            appId: notification.appId, subscriptionId, status: "QUEUED" as const,
          })),
        },
      },
    },
  });

  await processNotificationBatch(notificationId);
}
