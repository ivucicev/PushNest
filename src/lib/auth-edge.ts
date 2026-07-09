// Edge-compatible JWT verification — no Prisma, no Node crypto.
// Used only in middleware.
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export async function verifyTokenEdge(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
