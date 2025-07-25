import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Case } from "@/lib/caseStore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
import { poll } from "./poll";
import { type TestServer, startServer } from "./startServer";

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

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;

function envFiles() {
  fs.writeFileSync(
    path.join(tmpDir, "vinSources.json"),
    JSON.stringify(
      [
        { id: "edmunds", enabled: false, failureCount: 0 },
        { id: "carfax", enabled: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  return {
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
    NEXTAUTH_SECRET: "secret",
  };
}

async function fetchCase(id: string): Promise<Case> {
  const res = await poll(
    () => api(`/api/cases/${id}`),
    (r) => r.status === 200,
    20,
  );
  return (await res.json()) as Case;
}

beforeAll(async () => {
  stub = await startOpenAIStub([
    { violationType: "parking", details: "d", vehicle: {}, images: {} },
    () => ({
      violationType: "parking",
      details: "d",
      vehicle: { licensePlateNumber: "BBB222", licensePlateState: "IL" },
      images: {},
    }),
  ]);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(3007, envFiles());
  api = createApi(server);
  await signIn("user@example.com");
});

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("analysis queue", () => {
  it("processes additional photos sequentially", async () => {
    const file = await createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const { caseId } = (await res.json()) as { caseId: string };

    let data = await fetchCase(caseId);
    expect(Array.isArray(data.photos)).toBe(true);

    const second = await createPhoto("b");
    const add = new FormData();
    add.append("photo", second);
    add.append("caseId", caseId);
    const addRes = await api("/api/upload", {
      method: "POST",
      body: add,
    });
    expect(addRes.status).toBe(200);

    data = await poll(
      () => fetchCase(caseId),
      (d) => d.photos.length === 2,
      20,
    );
    expect(data.photos).toHaveLength(2);
  });

  it("removes analysis when photo is deleted", async () => {
    const file = await createPhoto("c");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const { caseId } = (await res.json()) as { caseId: string };

    let data = await fetchCase(caseId);
    const photo = data.photos[0];

    const second = await createPhoto("d");
    const add = new FormData();
    add.append("photo", second);
    add.append("caseId", caseId);
    await api("/api/upload", { method: "POST", body: add });

    data = await poll(
      () => fetchCase(caseId),
      (d) => d.photos.length === 2,
      20,
    );

    const del = await api(`/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    expect(del.status).toBe(200);
    const after = await del.json();
    expect(after.photos).toHaveLength(1);
  });
});
