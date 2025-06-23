export function getAnonymousSessionId(req: Request): string | undefined {
  const cookie = req.headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(/;\s*/)) {
    const [name, ...rest] = part.split("=");
    if (name === "anon_session_id") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

export function getAnonSession(req: Request): string | undefined {
  // handle tests where `req` may be a simple object without headers
  const headers = (req as { headers?: Headers }).headers;
  const cookie = headers?.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(/;\s*/)) {
    const [name, ...rest] = part.split("=");
    if (name === "anonSession") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}
