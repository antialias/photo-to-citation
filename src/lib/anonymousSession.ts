export function getAnonymousSessionId(req: Request): string | undefined {
  const headers = (req as { headers?: Headers }).headers ?? req.headers;
  const cookie = headers?.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(/;\s*/)) {
    const [name, ...rest] = part.split("=");
    if (name === "anon_session_id" || name === "anonSession") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}
