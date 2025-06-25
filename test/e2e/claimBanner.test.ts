import { getByText } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createPhoto } from "./photo";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

beforeAll(async () => {
  server = await startServer(3035, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
});

describe("claim banner", () => {
  it("shows banner for anonymous case", async () => {
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", { method: "POST", body: form });
    const { caseId } = (await res.json()) as { caseId: string };
    const page = await api(`/cases/${caseId}`).then((r) => r.text());
    const dom = new JSDOM(page);
    const banner = getByText(dom.window.document, /claim this case/i);
    expect(banner).toBeTruthy();
  });
});
