import { beforeAll, describe, expect, it } from "vitest";

interface TestServer {
  url: string;
}

let server: TestServer;

beforeAll(() => {
  server = global.__E2E_SERVER__ as TestServer;
});

describe("case events", () => {
  it("streams updates", async () => {
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
