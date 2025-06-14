import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Case } from "../../src/lib/caseStore";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

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
    CASE_STORE_FILE: path.join(tmpDir, "cases.json"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
  };
}

async function createPhoto(name: string): Promise<File> {
  return new File([Buffer.from(name)], `${name}.jpg`, { type: "image/jpeg" });
}

async function fetchCase(id: string): Promise<Case> {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${server.url}/api/cases/${id}`);
    if (res.status === 200) return (await res.json()) as Case;
    await new Promise((r) => setTimeout(r, 500));
  }
  const res = await fetch(`${server.url}/api/cases/${id}`);
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
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("analysis queue", () => {
  it("processes additional photos sequentially", async () => {
    const file = await createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`${server.url}/api/upload`, {
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
    const addRes = await fetch(`${server.url}/api/upload`, {
      method: "POST",
      body: add,
    });
    expect(addRes.status).toBe(200);

    for (let i = 0; i < 20; i++) {
      data = await fetchCase(caseId);
      if (data.photos.length === 2) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(data.photos).toHaveLength(2);
  }, 30000);

  it("removes analysis when photo is deleted", async () => {
    const file = await createPhoto("c");
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`${server.url}/api/upload`, {
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
    await fetch(`${server.url}/api/upload`, { method: "POST", body: add });

    for (let i = 0; i < 20; i++) {
      data = await fetchCase(caseId);
      if (data.photos.length === 2) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    const del = await fetch(`${server.url}/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    expect(del.status).toBe(200);
    const after = await del.json();
    expect(after.photos).toHaveLength(1);
  }, 30000);
});
