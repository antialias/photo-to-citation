export interface ApiOptions {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export function createApi(server: { url: string }): (
  path: string,
  opts?: RequestInit,
) => Promise<Response> {
  const jar = new Map<string, string>();
  const buildCookie = (): string =>
    Array.from(jar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

  return async (path: string, opts: RequestInit = {}): Promise<Response> => {
    const res = await fetch(`${server.url}${path}`, {
      ...opts,
      headers: { ...(opts.headers || {}), cookie: buildCookie() },
      redirect: "manual",
    });

    const set =
      res.headers.getSetCookie?.() ??
      (res.headers.has("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : []);
    for (const c of set) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("=");
      if (eq > -1) {
        jar.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
    }
    return res;
  };
}
