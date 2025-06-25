import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
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

async function createCase(): Promise<string> {
  const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
  const form = new FormData();
  form.append("photo", file);
  const res = await api("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { caseId: string };
  return data.caseId;
}

beforeAll(async () => {
  server = await startServer(3023, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
});

describe("notes e2e", () => {
  it("sets case and photo notes", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    let res = await api(`/api/cases/${id}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "hello" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      note?: string;
      photos: string[];
      photoNotes?: Record<string, string | null>;
    };
    expect(data.note).toBe("hello");
    const photo = data.photos[0];
    res = await api(`/api/cases/${id}/photo-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo, note: "img" }),
    });
    expect(res.status).toBe(200);
    const data2 = (await res.json()) as {
      photoNotes?: Record<string, string | null>;
      photos: string[];
      note?: string;
    };
    expect(data2.photoNotes?.[photo]).toBe("img");
  });
});
