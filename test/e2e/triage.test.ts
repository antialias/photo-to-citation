import { getByRole } from "@testing-library/dom";
import { Window } from "happy-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createAuthHelpers } from "./authHelpers";
import { createPhoto } from "./photo";
import { smokeEnv, smokePort } from "./smokeServer";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let signIn: (email: string) => Promise<Response>;
async function createCase(): Promise<string> {
  const file = createPhoto("a");
  const form = new FormData();
  form.append("photo", file);
  const res = await api("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { caseId: string };
  return data.caseId;
}

beforeAll(async () => {
  server = await startServer(smokePort, smokeEnv);
  api = createApi(server);
  ({ signIn } = createAuthHelpers(api, server));
  await signIn("user@example.com");
  await createCase();
});

afterAll(async () => {
  await server.close();
});

describe("triage page @smoke", () => {
  it("shows triage heading", async () => {
    const res = await api("/triage");
    expect(res.status).toBe(200);
    const html = await res.text();
    // @ts-expect-error happy-dom html option
    const dom = new Window({ html });
    const heading = getByRole(
      dom.window.document.body as unknown as HTMLElement,
      "heading",
      {
        name: /case triage/i,
      },
    );
    expect(heading).toBeTruthy();
  });
});
