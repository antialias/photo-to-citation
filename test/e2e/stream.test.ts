import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

async function signIn(email: string) {
  const csrf = await api("/api/auth/csrf").then((r) => r.json());
  await api("/api/auth/signin/email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      callbackUrl: server.url,
    }),
  });
  const ver = await api("/api/test/verification-url").then((r) => r.json());
  await api(
    `${new URL(ver.url).pathname}?${new URL(ver.url).searchParams.toString()}`,
  );
}

beforeAll(async () => {
  server = await startServer(3004, {
    NEXTAUTH_SECRET: "secret",
  });
  api = createApi(server);
  await signIn("user@example.com");
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("case events", () => {
  it.skip("streams updates", async () => {
    // warm up the server to ensure the route is compiled
    await fetch(`${server.url}/`);
    const res = await fetch(`${server.url}/api/cases/stream`);
    expect(res.status).toBe(200);
    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    if (!reader) throw new Error("no reader");
    const decoder = new TextDecoder();

    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    await fetch(`${server.url}/api/upload`, { method: "POST", body: form });

    let data = "";
    for (let i = 0; i < 20 && !data; i++) {
      const { value } = await reader.read();
      if (!value) continue;
      const chunk = decoder.decode(value);
      if (chunk.trim()) data += chunk;
    }
    expect(data).not.toBe("");
    reader.cancel();
  }, 30000);
});
