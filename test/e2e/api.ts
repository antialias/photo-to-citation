export interface ApiOptions {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export function createApi(server: { url: string }): (
  path: string,
  opts?: RequestInit,
) => Promise<Response> {
  let cookie = "";
  return async (path: string, opts: RequestInit = {}): Promise<Response> => {
    const res = await fetch(`${server.url}${path}`, {
      ...opts,
      headers: { ...(opts.headers || {}), cookie },
      redirect: "manual",
    });
    const set =
      res.headers.getSetCookie?.() ??
      (res.headers.has("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : []);
    if (set.length > 0) {
      cookie = set.map((c) => c.split(";")[0]).join("; ");
    }
    return res;
  };
}
