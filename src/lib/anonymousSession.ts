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
