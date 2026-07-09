export function isOriginAllowed(
  origin: string | null | undefined,
  domain: string,
  allowedOrigins: string[]
): boolean {
  if (!origin) return true; // server-side requests have no origin

  try {
    const url = new URL(origin);
    const originHost = url.hostname;

    // Check explicit allowed origins list
    if (allowedOrigins.length > 0) {
      for (const allowed of allowedOrigins) {
        try {
          const allowedHost = new URL(allowed).hostname;
          if (originHost === allowedHost) return true;
        } catch {
          if (originHost === allowed) return true;
        }
      }
    }

    // Check app domain
    const domainHost = domain.replace(/^https?:\/\//, "").split("/")[0];
    return originHost === domainHost || originHost.endsWith(`.${domainHost}`);
  } catch {
    return false;
  }
}
