import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAndSendNotification } from "@/lib/send-notification";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

const schema = z.object({
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; campaignId: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { appId, campaignId } = await params;

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return notFound("App");
  if (app.userId !== session.id) return forbidden();

  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, appId } });
  if (!campaign) return notFound("Campaign");
  if (campaign.status === "SENDING") return err("Campaign is already sending");

  let scheduledAt: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (parsed.success) scheduledAt = parsed.data.scheduledAt;
  } catch { /* body may be empty */ }

  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  try {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: isScheduled ? "DRAFT" : "SENDING",
        scheduledAt: isScheduled ? new Date(scheduledAt!) : null,
      },
    });

    const audience = campaign.audience ? JSON.parse(campaign.audience) : undefined;
    const data = campaign.data ? JSON.parse(campaign.data) : undefined;

    const { notification, queued, scheduled } = await createAndSendNotification(
      appId,
      {
        title: campaign.title,
        body: campaign.body,
        url: campaign.url ?? undefined,
        icon: campaign.icon ?? undefined,
        badge: campaign.badge ?? undefined,
        tag: campaign.tag ?? undefined,
        data,
        audience,
        scheduledAt,
      },
      "DASHBOARD",
      campaignId
    );

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: isScheduled ? "DRAFT" : "SENT",
        sentAt: isScheduled ? null : new Date(),
      },
    });

    return ok({ ok: true, notificationId: notification.id, queued, scheduled });
  } catch {
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: "FAILED" } }).catch(() => {});
    return err("Internal server error", 500);
  }
}
