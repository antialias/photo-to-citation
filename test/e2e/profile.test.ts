import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { smokeEnv, smokePort } from "./smokeServer";
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

beforeAll(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(smokePort, {
    ...smokeEnv,
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
});

describe("profile page e2e @smoke", () => {
  it("blocks anonymous access", async () => {
    const res = await api("/settings");
    const html = await res.text();
    const dom = new JSDOM(html);
    expect(dom.window.document.body.textContent).toMatch(/not logged in/i);
  });

  it("reads and updates profile", async () => {
    await signIn("profile@example.com");

    let res = await api("/api/profile");
    expect(res.status).toBe(200);
    let data = (await res.json()) as {
      name?: string;
      image?: string;
      address?: string;
      cityStateZip?: string;
      daytimePhone?: string;
      driverLicenseNumber?: string;
      driverLicenseState?: string;
    };
    expect(data.name ?? "").toBe("");

    res = await api("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Tester",
        image: "/img",
        bio: "hi",
        socialLinks: "http://link",
        address: "123 A St",
        cityStateZip: "City, ST 12345",
        daytimePhone: "555-0000",
        driverLicenseNumber: "D123",
        driverLicenseState: "IL",
      }),
    });
    expect(res.status).toBe(200);

    res = await api("/api/profile");
    data = (await res.json()) as {
      name?: string;
      image?: string;
      address?: string;
      cityStateZip?: string;
      daytimePhone?: string;
      driverLicenseNumber?: string;
      driverLicenseState?: string;
    };
    expect(data.name).toBe("Tester");
    expect(data.image).toBe("/img");
    expect(data.address).toBe("123 A St");
    expect(data.cityStateZip).toBe("City, ST 12345");
    expect(data.daytimePhone).toBe("555-0000");
    expect(data.driverLicenseNumber).toBe("D123");
    expect(data.driverLicenseState).toBe("IL");

    const page = await api("/settings").then((r) => r.text());
    const dom = new JSDOM(page);
    const heading = getByRole(dom.window.document, "heading", {
      name: /user settings/i,
    });
    expect(heading).toBeTruthy();
  });
});
