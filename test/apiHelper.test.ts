import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApi } from "./e2e/api";

describe("createApi cookie jar", () => {
  const responses: Response[] = [
    new Response(null, { headers: { "set-cookie": "a=1" } }),
    new Response(null, { headers: { "set-cookie": "b=2" } }),
    new Response(null, { headers: { "set-cookie": "a=3" } }),
    new Response(null, {}),
  ];
  const calls: RequestInit[] = [];

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        calls.push(init || {});
        return responses.shift() as Response;
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves cookies across requests", async () => {
    const api = createApi({ url: "http://test" });
    await api("/first");
    await api("/second");
    await api("/third");
    await api("/fourth");

    const headers0 = calls[0].headers as Record<string, string>;
    const headers1 = calls[1].headers as Record<string, string>;
    const headers2 = calls[2].headers as Record<string, string>;
    const headers3 = calls[3].headers as Record<string, string>;
    expect(headers0.cookie).toBe("");
    expect(headers1.cookie).toBe("a=1");
    expect(headers2.cookie).toBe("a=1; b=2");
    expect(headers3.cookie).toBe("a=3; b=2");
  });
});
