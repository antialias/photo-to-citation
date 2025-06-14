import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;

beforeAll(async () => {
  const first = {
    violationType: "parking",
    details: "",
    vehicle: {},
    images: {},
  };
  const second = {
    violationType: "parking",
    details: "",
    vehicle: { licensePlateNumber: "XYZ", licensePlateState: "IL" },
    images: { "a.jpg": { representationScore: 1, violation: true } },
  };
  stub = await startOpenAIStub([first, second]);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.json"),
    OPENAI_BASE_URL: stub.url,
  };
  server = await startServer(3008, env);
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("reanalyze single image", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`${server.url}/api/upload`, {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("updates missing fields from image", async () => {
    const id = await createCase();
    let res: Response | null = null;
    for (let i = 0; i < 10; i++) {
      const attempt = await fetch(`${server.url}/api/cases/${id}`);
      if (attempt.status === 200) {
        res = attempt;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(res).not.toBeNull();
    const initial = (await (res as Response).json()) as {
      photos: string[];
      analysis: Record<string, unknown>;
    };
    expect(initial.analysis.vehicle.licensePlateNumber).toBeUndefined();
    const photo = initial.photos[0];
    const update = await fetch(
      `${server.url}/api/cases/${id}/reanalyze-image`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo }),
      },
    );
    expect(update.status).toBe(200);
    const updated = (await update.json()) as {
      analysis: Record<string, unknown>;
    };
    expect(updated.analysis.vehicle.licensePlateNumber).toBe("XYZ");
    expect(stub.requests.length).toBe(2);
  }, 30000);
});
