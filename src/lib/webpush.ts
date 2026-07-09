import webpush from "web-push";

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

export function generateVapidKeys(): VapidKeys {
  return webpush.generateVAPIDKeys();
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendWebPush(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload,
  vapid: {
    publicKey: string;
    privateKey: string;
    subject: string;
  }
): Promise<{ statusCode: number; success: boolean; error?: string }> {
  try {
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({ notification: payload }),
      {
        vapidDetails: {
          subject: vapid.subject,
          publicKey: vapid.publicKey,
          privateKey: vapid.privateKey,
        },
        TTL: 86400,
      }
    );
    return { statusCode: result.statusCode, success: true };
  } catch (err: unknown) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    return {
      statusCode: e.statusCode ?? 0,
      success: false,
      error: e.body ?? e.message ?? "Unknown error",
    };
  }
}
