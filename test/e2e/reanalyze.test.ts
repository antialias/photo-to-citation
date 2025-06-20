import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
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
let photoName = "";

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
      ]);
    }, 120000);

    afterAll(async () => {
      await teardown();
    }, 120000);

    it("adds vehicle info on reanalysis", async () => {
      const file = new File([Buffer.from("a")], "a.jpg", {
        type: "image/jpeg",
      });
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
      let json: CaseData | undefined;
      for (let i = 0; i < 5; i++) {
        const check = await api(`/api/cases/${caseId}`);
        if (check.status === 200) {
          json = (await check.json()) as CaseData;
          break;
        }
        await new Promise((r) => setTimeout(() => r(undefined), 75));
      }
      expect(json).toBeDefined();
      if (!json) throw new Error("case data not found");
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);
      expect(json.analysis?.vehicle?.licensePlateNumber).toBeUndefined();

      const re = await api(
        `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`,
        { method: "POST" },
      );
      expect(re.status).toBe(200);
      for (let i = 0; i < 5; i++) {
        const check = await api(`/api/cases/${caseId}`);
        if (check.status === 200) break;
        await new Promise((r) => setTimeout(() => r(undefined), 75));
      }
      expect(stub.requests.length).toBeGreaterThanOrEqual(1);
    }, 30000);
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
    }, 120000);

    afterAll(async () => {
      await teardown();
    }, 120000);

    it("extracts paperwork text on reanalysis", async () => {
      const file = new File([Buffer.from("b")], "b.jpg", {
        type: "image/jpeg",
      });
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
      let json: CaseData | undefined;
      for (let i = 0; i < 5; i++) {
        const check = await api(`/api/cases/${caseId}`);
        if (check.status === 200) {
          json = (await check.json()) as CaseData;
          break;
        }
        await new Promise((r) => setTimeout(() => r(undefined), 75));
      }
      expect(json).toBeDefined();
      if (!json) throw new Error("case data not found");
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);
      expect(json.analysis?.images?.[photoName]).toBeUndefined();

      const re = await api(
        `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`,
        { method: "POST" },
      );
      expect(re.status).toBe(200);
      for (let i = 0; i < 5; i++) {
        const check = await api(`/api/cases/${caseId}`);
        if (check.status === 200) break;
        await new Promise((r) => setTimeout(() => r(undefined), 75));
      }
      expect(stub.requests.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });
});
