import { getByRole } from "@testing-library/dom";
import { Window } from "happy-dom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { smokeEnv, smokePort } from "./smokeServer";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;

beforeAll(async () => {
  server = await startServer(smokePort, smokeEnv);
});

afterAll(async () => {
  await server.close();
});

describe("end-to-end @smoke", () => {
  it("serves the homepage", async () => {
    const res = await fetch(`${server.url}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // @ts-expect-error happy-dom html option
    const dom = new Window({ html });
    const heading = getByRole(
      dom.window.document.body as unknown as HTMLElement,
      "heading",
      {
        name: /photo to citation/i,
      },
    );
    expect(heading).toBeTruthy();
  });
});
