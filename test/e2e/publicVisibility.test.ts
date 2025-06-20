import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";

interface TestServer {
  url: string;
}

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

beforeAll(() => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = global.__E2E_SERVER__ as TestServer;
  api = createApi(server);
});

describe("case visibility", () => {
  it("shows toggle for admins", async () => {
    await signIn("admin@example.com");
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const upload = await api("/api/upload", { method: "POST", body: form });
    const { caseId } = (await upload.json()) as { caseId: string };

    const page = await api(`/cases/${caseId}`).then((r) => r.text());
    expect(page).toContain("Make Public");
  }, 30000);
});
