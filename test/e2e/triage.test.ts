import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createAuthHelpers } from "./authHelpers";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let signIn: (email: string) => Promise<Response>;

beforeAll(async () => {
  server = await startServer(3040, { NEXTAUTH_SECRET: "secret" });
  api = createApi(server);
  ({ signIn } = createAuthHelpers(api, server));
  await signIn("user@example.com");
});

afterAll(async () => {
  await server.close();
});

describe("triage page @smoke", () => {
  it("shows triage heading", async () => {
    const res = await api("/triage");
    expect(res.status).toBe(200);
    const html = await res.text();
    const dom = new JSDOM(html);
    const heading = getByRole(dom.window.document, "heading", {
      name: /case triage/i,
    });
    expect(heading).toBeTruthy();
  });
});
