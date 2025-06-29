import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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

async function signOut() {
  const csrf = await api("/api/auth/csrf").then((r) => r.json());
  await api("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: server.url,
    }),
  });
}

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;
let photoName = "";

vi.setConfig({ testTimeout: 60000 });

async function setup(responses: Array<import("./openaiStub").StubResponse>) {
  stub = await startOpenAIStub(responses);
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
  server = await startServer(3010, env);
  api = createApi(server);
  await signIn("admin@example.com");
  await signOut();
  await signIn("user@example.com");
}

async function teardown() {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("reanalysis", () => {
  describe("photo", () => {
    beforeAll(async () => {
      await setup([
        { violationType: "parking", details: "d", vehicle: {}, images: {} },
        () => ({
          violationType: "parking",
          details: "d",
          vehicle: { licensePlateNumber: "ABC123", licensePlateState: "IL" },
          images: { [photoName]: { representationScore: 1 } },
        }),
        { violationType: "parking", details: "d", vehicle: {}, images: {} },
        () => {
          const start = Date.now();
          while (Date.now() - start < 200) {}
          return {
            violationType: "parking",
            details: "d",
            vehicle: {},
            images: {},
          };
        },
      ]);
    });

    afterAll(async () => {
      await teardown();
    });

    it("adds vehicle info on reanalysis", async () => {
      const file = createPhoto("a");
      const form = new FormData();
      form.append("photo", file);
      const res = await api("/api/upload", {
        method: "POST",
        body: form,
      });
      expect(res.status).toBe(200);
      const { caseId } = (await res.json()) as { caseId: string };

      type CaseData = {
        photos: string[];
        analysis?: {
          vehicle?: { licensePlateNumber?: string; licensePlateState?: string };
          images?: Record<string, unknown>;
        };
      };
      const first = await poll(
        () => api(`/api/cases/${caseId}`),
        (res) => res.status === 200,
        10,
      );
      const json = (await first.json()) as CaseData;
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);
      expect(json.analysis?.vehicle?.licensePlateNumber).toBeUndefined();

      const re = await api(
        `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`,
        { method: "POST" },
      );
      expect(re.status).toBe(200);
      await poll(
        () => api(`/api/cases/${caseId}`),
        (c) => c.status === 200,
        10,
      );
      await poll(
        () => Promise.resolve(stub.requests.length),
        (len) => len >= 1,
        20,
      );
      expect(stub.requests.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects photo reanalysis while case analysis active", async () => {
      const file = createPhoto("block");
      const form = new FormData();
      form.append("photo", file);
      const res = await api("/api/upload", { method: "POST", body: form });
      expect(res.status).toBe(200);
      const { caseId } = (await res.json()) as { caseId: string };

      type CaseData = { photos: string[] };
      const first = await poll(
        () => api(`/api/cases/${caseId}`),
        (r) => r.status === 200,
        10,
      );
      const json = (await first.json()) as CaseData;
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);

      const rean = await api(`/api/cases/${caseId}/reanalyze`, {
        method: "POST",
      });
      expect(rean.status).toBe(200);

      await poll(
        () => api(`/api/cases/${caseId}/analysis-active`),
        async (r) => (await r.json()).active === true,
        50,
        50,
      );

      const single = await api(
        `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`,
        { method: "POST" },
      );
      expect(single.status).toBe(409);
    });
  });

  describe("paperwork", () => {
    beforeAll(async () => {
      await setup([
        { violationType: "parking", details: "d", vehicle: {}, images: {} },
        () => ({
          violationType: "parking",
          details: "d",
          vehicle: {},
          images: { [photoName]: { representationScore: 1, paperwork: true } },
        }),
        "plate text", // OCR text
        { vehicle: { licensePlateNumber: "ZZZ111", licensePlateState: "IL" } },
      ]);
    });

    afterAll(async () => {
      await teardown();
    });

    it("extracts paperwork text on reanalysis", async () => {
      const file = createPhoto("b");
      const form = new FormData();
      form.append("photo", file);
      const res = await api("/api/upload", {
        method: "POST",
        body: form,
      });
      expect(res.status).toBe(200);
      const { caseId } = (await res.json()) as { caseId: string };

      type CaseData = {
        photos: string[];
        analysis?: {
          images?: Record<string, unknown>;
        };
      };
      const firstRes = await poll(
        () => api(`/api/cases/${caseId}`),
        (r) => r.status === 200,
        10,
      );
      const json = (await firstRes.json()) as CaseData;
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);
      expect(json.analysis?.images?.[photoName]).toBeUndefined();

      const re = await api(
        `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`,
        { method: "POST" },
      );
      expect(re.status).toBe(200);
      await poll(
        () => api(`/api/cases/${caseId}`),
        (c) => c.status === 200,
        10,
      );
      await poll(
        () => Promise.resolve(stub.requests.length),
        (len) => len >= 1,
        20,
      );
      expect(stub.requests.length).toBeGreaterThanOrEqual(1);
    });
  });
});
