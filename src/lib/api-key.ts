import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `pn_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 10);
  return { raw, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(key: string) {
  if (!key) return null;
  const hash = hashApiKey(key);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: {
      app: {
        select: {
          id: true,
          userId: true,
          name: true,
          domain: true,
          allowedOrigins: true,
          vapidPublicKey: true,
          vapidPrivateKey: true,
          vapidSubject: true,
          status: true,
        },
      },
    },
  });
  if (!apiKey || apiKey.app.status !== "ACTIVE") return null;

  // update last used async (fire and forget)
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return apiKey;
}
