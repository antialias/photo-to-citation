import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByText } from "@testing-library/dom";
import { Window } from "happy-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createPhoto } from "./photo";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let dataDir: string;

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  server = await startServer(3035, {
    CASE_STORE_FILE: path.join(dataDir, "cases.sqlite"),
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe("claim banner", () => {
  it("shows banner for anonymous case", async () => {
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", { method: "POST", body: form });
    const { caseId } = (await res.json()) as { caseId: string };
    const page = await api(`/cases/${caseId}`).then((r) => r.text());
    // @ts-expect-error happy-dom html option
    const dom = new Window({ html: page });
    const banner = getByText(
      dom.window.document.body as unknown as HTMLElement,
      /claim this case/i,
    );
    expect(banner).toBeTruthy();
  });
});
