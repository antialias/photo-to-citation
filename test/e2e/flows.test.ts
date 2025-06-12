import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  process.env.CASE_STORE_FILE = path.join(tmpDir, "cases.json");
  process.env.VIN_SOURCE_FILE = path.join(tmpDir, "vinSources.json");
  server = await startServer(3003);
}, 30000);

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.env.CASE_STORE_FILE = undefined;
  process.env.VIN_SOURCE_FILE = undefined;
}, 30000);

describe("e2e flows", () => {
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

  it("handles case lifecycle", async () => {
    const caseId = await createCase();

    const second = new File([Buffer.from("b")], "b.jpg", {
      type: "image/jpeg",
    });
    const add = new FormData();
    add.append("photo", second);
    add.append("caseId", caseId);
    const res2 = await fetch(`${server.url}/api/upload`, {
      method: "POST",
      body: add,
    });
    expect(res2.status).toBe(200);
    const data2 = (await res2.json()) as { caseId: string };
    expect(data2.caseId).toBe(caseId);

    const res = await fetch(`${server.url}/api/cases/${caseId}`);
    expect(res.status).toBe(200);
    let json = await res.json();
    expect(json.photos).toHaveLength(2);

    const delRes = await fetch(`${server.url}/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: json.photos[0] }),
    });
    expect(delRes.status).toBe(200);
    json = await delRes.json();
    expect(json.photos).toHaveLength(1);

    const overrideRes = await fetch(
      `${server.url}/api/cases/${caseId}/override`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: { licensePlateNumber: "ABC123", licensePlateState: "IL" },
          violationType: "parking",
        }),
      },
    );
    expect(overrideRes.status).toBe(200);
    json = await overrideRes.json();
    expect(json.analysis.vehicle.licensePlateNumber).toBe("ABC123");

    const vinRes = await fetch(`${server.url}/api/cases/${caseId}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: "1HGCM82633A004352" }),
    });
    expect(vinRes.status).toBe(200);
    json = await vinRes.json();
    expect(json.vin).toBe("1HGCM82633A004352");

    const ownRes = await fetch(
      `${server.url}/api/cases/${caseId}/ownership-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: "il", checkNumber: "42" }),
      },
    );
    expect(ownRes.status).toBe(200);
    json = await ownRes.json();
    expect(json.ownershipRequests).toHaveLength(1);

    const delCase = await fetch(`${server.url}/api/cases/${caseId}`, {
      method: "DELETE",
    });
    expect(delCase.status).toBe(200);
    const notFound = await fetch(`${server.url}/api/cases/${caseId}`);
    expect(notFound.status).toBe(404);
  }, 30000);

  it("shows summary for multiple cases", async () => {
    const id1 = await createCase();
    const id2 = await createCase();
    const res = await fetch(`${server.url}/cases?ids=${id1},${id2}`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Case Summary");
  }, 30000);

  it("toggles vin source modules", async () => {
    const listRes = await fetch(`${server.url}/api/vin-sources`);
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as Array<{
      id: string;
      enabled: boolean;
    }>;
    expect(Array.isArray(list)).toBe(true);
    const id = list[0].id;
    const update = await fetch(`${server.url}/api/vin-sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    expect(update.status).toBe(200);
    const updated = (await update.json()) as Array<{
      id: string;
      enabled: boolean;
    }>;
    const found = updated.find((s) => s.id === id);
    expect(found?.enabled).toBe(false);
  }, 30000);
});
