import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it, test } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { poll } from "./poll";
import { type TestServer, startServer } from "./startServer";

let api: (path: string, opts?: RequestInit) => Promise<Response>;

async function signIn(email: string) {
  const csrfRes = await api("/api/auth/csrf");
  expect(csrfRes.status).toBe(200);
  const csrf = (await csrfRes.json()) as { csrfToken: string };
  const signInRes = await api("/api/auth/signin/email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      callbackUrl: server.url,
    }),
  });
  expect(signInRes.status).toBeLessThan(400);
  const verRes = await api("/api/test/verification-url");
  expect(verRes.status).toBe(200);
  const ver = (await verRes.json()) as { url: string };
  const verifyRes = await api(
    `${new URL(ver.url).pathname}?${new URL(ver.url).searchParams.toString()}`,
  );
  expect(verifyRes.status).toBeLessThan(400);
}

async function signOut() {
  const csrfRes = await api("/api/auth/csrf");
  expect(csrfRes.status).toBe(200);
  const csrf = (await csrfRes.json()) as { csrfToken: string };
  const res = await api("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: server.url,
    }),
  });
  expect(res.status).toBeLessThan(400);
}

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;

test.setTimeout(60000);

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
    NEXTAUTH_SECRET: "secret",
  };
  fs.writeFileSync(
    env.VIN_SOURCE_FILE,
    JSON.stringify(
      [
        { id: "edmunds", enabled: false, failureCount: 0 },
        { id: "carfax", enabled: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  server = await startServer(3003, env);
  api = createApi(server);
  await signIn("admin@example.com");
  await signOut();
  await signIn("user@example.com");
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("e2e flows (unauthenticated)", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  async function fetchCase(id: string): Promise<Response> {
    return poll(
      () => api(`/api/cases/${id}`),
      (res) => res.status === 200,
      10,
    );
  }

  async function waitForPhotos(id: string, count: number) {
    const res = await poll(
      () => fetchCase(id),
      async (r) => {
        if (r.status !== 200) return false;
        const json = await r.clone().json();
        return Array.isArray(json.photos) && json.photos.length === count;
      },
      20,
    );
    return res.json();
  }

  async function putVin(id: string, vin: string): Promise<Response> {
    return poll(
      () =>
        api(`/api/cases/${id}/vin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin }),
        }),
      (res) => res.status === 200,
      10,
    );
  }

  it("handles case lifecycle", async () => {
    const caseId = await createCase();

    const second = new File([Buffer.from("b")], "b.jpg", {
      type: "image/jpeg",
    });
    const add = new FormData();
    add.append("photo", second);
    add.append("caseId", caseId);
    const res2 = await api("/api/upload", {
      method: "POST",
      body: add,
    });
    expect(res2.status).toBe(200);
    const data2 = (await res2.json()) as { caseId: string };
    expect(data2.caseId).toBe(caseId);

    let json = await waitForPhotos(caseId, 2);
    expect(json.photos).toHaveLength(2);

    const delRes = await api(`/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: json.photos[0] }),
    });
    expect(delRes.status).toBe(200);
    json = await waitForPhotos(caseId, 1);
    expect(json.photos).toHaveLength(1);

    const overrideRes = await api(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: { licensePlateNumber: "ABC123", licensePlateState: "IL" },
        violationType: "parking",
      }),
    });
    expect(overrideRes.status).toBe(200);

    const vinRes = await putVin(caseId, "1HGCM82633A004352");
    expect(vinRes.status).toBe(200);

    const ownRes = await api(`/api/cases/${caseId}/ownership-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: "il", checkNumber: "42" }),
    });
    expect(ownRes.status).toBe(200);

    const delCase = await api(`/api/cases/${caseId}`, {
      method: "DELETE",
    });
    expect(delCase.status).toBe(200);
    const notFound = await api(`/api/cases/${caseId}`);
    expect(notFound.status).toBe(404);
  });

  it("shows summary for multiple cases", async () => {
    const id1 = await createCase();
    const id2 = await createCase();
    const res = await api(`/cases?ids=${id1},${id2}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    const dom = new JSDOM(html);
    const heading = getByRole(dom.window.document, "heading", {
      name: /case summary/i,
    });
    expect(heading).toBeTruthy();
  });

  it("deletes a case", async () => {
    const id = await createCase();
    const del = await api(`/api/cases/${id}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);
    const notFound = await api(`/api/cases/${id}`);
    expect(notFound.status).toBe(404);
  });

  it("deletes multiple cases", async () => {
    const id1 = await createCase();
    const id2 = await createCase();
    const [r1, r2] = await Promise.all([
      api(`/api/cases/${id1}`, { method: "DELETE" }),
      api(`/api/cases/${id2}`, { method: "DELETE" }),
    ]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const nf1 = await api(`/api/cases/${id1}`);
    const nf2 = await api(`/api/cases/${id2}`);
    expect(nf1.status).toBe(404);
    expect(nf2.status).toBe(404);
  });

  it("toggles vin source modules", async () => {
    const listRes = await api("/api/vin-sources");
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as Array<{
      id: string;
      enabled: boolean;
    }>;
    expect(Array.isArray(list)).toBe(true);
    const id = list[0].id;
    const update = await api(`/api/vin-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    expect(update.status).toBe(403);
  });

  it("allows admin to toggle vin source modules", async () => {
    await signOut();
    await signIn("admin@example.com");
    const listRes = await api("/api/vin-sources");
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as Array<{
      id: string;
      enabled: boolean;
    }>;
    const id = list[0].id;
    const before = list[0].enabled;
    const update = await api(`/api/vin-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !before }),
    });
    expect(update.status).toBe(200);
    const afterList = (await update.json()) as Array<{
      id: string;
      enabled: boolean;
    }>;
    const updated = afterList.find((s) => s.id === id);
    expect(updated?.enabled).toBe(!before);
    await signOut();
    await signIn("user@example.com");
  });
});
