import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;
let photoName = "";

async function setup(responses: Array<import("./openaiStub").StubResponse>) {
  stub = await startOpenAIStub(responses);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.json"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
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
      const res = await fetch(`${server.url}/api/upload`, {
        method: "POST",
        body: form,
      });
      expect(res.status).toBe(200);
      const { caseId } = (await res.json()) as { caseId: string };

      let json: Record<string, unknown> | undefined;
      for (let i = 0; i < 10; i++) {
        const check = await fetch(`${server.url}/api/cases/${caseId}`);
        if (check.status === 200) {
          json = await check.json();
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      expect(json).toBeDefined();
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);
      expect(json.analysis?.vehicle?.licensePlateNumber).toBeUndefined();

      const re = await fetch(
        `${server.url}/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(
          photo,
        )}`,
        { method: "POST" },
      );
      expect(re.status).toBe(200);
      const data = await re.json();
      expect(data.analysis.vehicle.licensePlateNumber).toBe("ABC123");
      expect(stub.requests.length).toBe(2);
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
      const res = await fetch(`${server.url}/api/upload`, {
        method: "POST",
        body: form,
      });
      expect(res.status).toBe(200);
      const { caseId } = (await res.json()) as { caseId: string };

      let json: Record<string, unknown> | undefined;
      for (let i = 0; i < 10; i++) {
        const check = await fetch(`${server.url}/api/cases/${caseId}`);
        if (check.status === 200) {
          json = await check.json();
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      expect(json).toBeDefined();
      const photo = json.photos[0] as string;
      photoName = path.basename(photo);
      expect(json.analysis?.images?.[photoName]).toBeUndefined();

      const re = await fetch(
        `${server.url}/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(
          photo,
        )}`,
        { method: "POST" },
      );
      expect(re.status).toBe(200);
      const data = await re.json();
      console.log("DATA", JSON.stringify(data));
      expect(data.analysis.vehicle.licensePlateNumber).toBe("ZZZ111");
      expect(stub.requests.length).toBe(4);
    }, 30000);
  });
});
