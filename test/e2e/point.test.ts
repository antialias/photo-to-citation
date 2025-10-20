import { getByRole } from "@testing-library/dom";
import { Window } from "happy-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;

beforeAll(async () => {
  server = await startServer(3005, {
    NEXTAUTH_SECRET: "secret",
  });
});

afterAll(async () => {
  await server.close();
});

describe("point and shoot", () => {
  it("serves the point page", async () => {
    const res = await fetch(`${server.url}/point`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // @ts-expect-error happy-dom html option
    const dom = new Window({ html });
    const button = getByRole(
      dom.window.document.body as unknown as HTMLElement,
      "button",
      {
        name: /take picture/i,
      },
    );
    expect(button).toBeTruthy();
  });
});
