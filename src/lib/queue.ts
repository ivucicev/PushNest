import { prisma } from "./prisma";
import { sendWebPush } from "./webpush";
import { fireWebhooks } from "./webhooks";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function processNotificationBatch(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      app: {
        select: { id: true, vapidPublicKey: true, vapidPrivateKey: true, vapidSubject: true },
      },
    },
  });
  if (!notification) return;

  const logs = await prisma.deliveryLog.findMany({
    where: { notificationId, status: "QUEUED" },
    include: {
      subscription: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
    },
  });

  if (logs.length === 0) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "SENT", updatedAt: new Date() },
    });
    return;
  }

  await prisma.notification.update({ where: { id: notificationId }, data: { status: "SENDING" } });

  let sentCount = 0;
  let failedCount = 0;

  for (const log of logs) {
    const extraData = notification.data ? JSON.parse(notification.data) : {};

    const payload = {
      title: notification.title,
      body: notification.body ?? undefined,
      url: notification.url ?? undefined,
      icon: notification.icon ?? undefined,
      badge: notification.badge ?? undefined,
      tag: notification.tag ?? undefined,
      data: {
        ...extraData,
        // Injected for click tracking — consumed by service worker
        notificationId: notification.id,
        subscriptionId: log.subscription.id,
        trackClickUrl: `${APP_URL}/api/v1/track/click`,
      },
    };

    const result = await sendWebPush(log.subscription, payload, {
      publicKey: notification.app.vapidPublicKey,
      privateKey: notification.app.vapidPrivateKey,
      subject: notification.app.vapidSubject,
    });

    const now = new Date();
    if (result.success) {
      sentCount++;
      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: { status: "SENT", statusCode: result.statusCode, sentAt: now },
      });
      fireWebhooks(notification.appId, "notification.sent", {
        notificationId: notification.id,
        subscriptionId: log.subscription.id,
        statusCode: result.statusCode,
      }).catch(() => {});
    } else {
      failedCount++;
      const isExpired = result.statusCode === 404 || result.statusCode === 410;
      const logStatus = isExpired ? "EXPIRED" : "FAILED";

      await prisma.deliveryLog.update({
        where: { id: log.id },
        data: { status: logStatus, statusCode: result.statusCode, errorMessage: result.error, sentAt: now },
      });

      if (isExpired) {
        await prisma.pushSubscription.update({
          where: { id: log.subscription.id },
          data: { status: "EXPIRED" },
        });
        fireWebhooks(notification.appId, "notification.expired", {
          notificationId: notification.id,
          subscriptionId: log.subscription.id,
        }).catch(() => {});
      } else {
        fireWebhooks(notification.appId, "notification.failed", {
          notificationId: notification.id,
          subscriptionId: log.subscription.id,
          statusCode: result.statusCode,
          error: result.error,
        }).catch(() => {});
      }
    }
  }

  const allFailed = failedCount === logs.length;
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: allFailed ? "FAILED" : "SENT",
      sentCount: { increment: sentCount },
      failedCount: { increment: failedCount },
      updatedAt: new Date(),
    },
  });
}
