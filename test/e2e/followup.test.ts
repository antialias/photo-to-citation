import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";
import { createAuthHelpers } from "./authHelpers";

let api: (path: string, opts?: RequestInit) => Promise<Response>;
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;

beforeAll(async () => {
  stub = await startOpenAIStub([
    {
      violationType: "parking",
      details: "car parked illegally",
      vehicle: {},
      images: {},
    },
    { subject: "s", body: "b" },
  ]);
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
  server = await startServer(3005, env);
  api = createApi(server);
  ({ signIn, signOut } = createAuthHelpers(api, server));
  await signIn("user@example.com");
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("follow up", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    for (let i = 0; i < 20; i++) {
      const res = await api("/api/upload", {
        method: "POST",
        body: form,
      });
      if (res.status === 200) {
        const data = (await res.json()) as { caseId: string };
        return data.caseId;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    const final = await api("/api/upload", {
      method: "POST",
      body: form,
    });
    const data = (await final.json()) as { caseId: string };
    return data.caseId;
  }

  async function fetchFollowup(id: string): Promise<Response> {
    for (let i = 0; i < 20; i++) {
      const res = await api(`/api/cases/${id}/followup`);
      if (res.status === 200) return res;
      await new Promise((r) => setTimeout(r, 500));
    }
    return api(`/api/cases/${id}/followup`);
  }

  it("passes prior emails to openai", async () => {
    const id = await createCase();
    const caseFile = path.join(tmpDir, "cases.sqlite");
    const db = new Database(caseFile);
    const row = db.prepare("SELECT data FROM cases WHERE id = ?").get(id) as {
      data: string;
    };
    const info = JSON.parse(row.data) as Record<string, unknown>;
    info.sentEmails = [
      {
        subject: "orig",
        body: "first message",
        attachments: [],
        sentAt: new Date().toISOString(),
      },
    ];
    db.prepare("UPDATE cases SET data = ? WHERE id = ?").run(
      JSON.stringify(info),
      id,
    );
    db.close();

    const res = await fetchFollowup(id);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email.subject).toBe("s");
    const request = stub.requests.at(-1) as {
      body: { messages: Array<{ content: string }> };
    };
    expect(request.body.messages[1].content).toContain("first message");
  }, 30000);
});
