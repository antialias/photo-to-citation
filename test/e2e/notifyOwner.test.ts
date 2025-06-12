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
  const analysis = {
    violationType: "parking",
    details: "desc",
    images: {
      "a.jpg": {
        representationScore: 1,
        violation: true,
        paperwork: true,
        paperworkText: "text",
        paperworkInfo: { contact: "owner@example.com", vehicle: {} },
      },
    },
  };
  stub = await startOpenAIStub([analysis, { subject: "s", body: "b" }]);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const caseFile = path.join(tmpDir, "cases.json");
  const vinFile = path.join(tmpDir, "vinSources.json");
  process.env.CASE_STORE_FILE = caseFile;
  process.env.VIN_SOURCE_FILE = vinFile;
  process.env.OPENAI_BASE_URL = stub.url;
  fs.writeFileSync(
    vinFile,
    JSON.stringify(
      [
        { id: "edmunds", enabled: false, failureCount: 0 },
        { id: "carfax", enabled: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  server = await startServer(3006);
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.env.CASE_STORE_FILE = undefined;
  process.env.VIN_SOURCE_FILE = undefined;
  process.env.OPENAI_BASE_URL = undefined;
}, 120000);

describe("owner notification", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${server.url}/api/upload`, {
        method: "POST",
        body: form,
      });
      if (res.status === 200) {
        const data = (await res.json()) as { caseId: string };
        return data.caseId;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    const final = await fetch(`${server.url}/api/upload`, {
      method: "POST",
      body: form,
    });
    const data = (await final.json()) as { caseId: string };
    return data.caseId;
  }

  async function fetchNotification(id: string): Promise<Response> {
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${server.url}/api/cases/${id}/notify-owner`);
      if (res.status === 200) return res;
      await new Promise((r) => setTimeout(r, 500));
    }
    return fetch(`${server.url}/api/cases/${id}/notify-owner`);
  }

  it("drafts owner email when contact exists", async () => {
    const id = await createCase();
    const res = await fetchNotification(id);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email.subject).toBe("s");
    expect(data.contact).toBe("owner@example.com");
    expect(Array.isArray(data.attachments)).toBe(true);
    expect(stub.requests.length).toBeGreaterThanOrEqual(2);
  }, 30000);
});
