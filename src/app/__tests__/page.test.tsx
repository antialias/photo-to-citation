import { beforeAll, describe, expect, it } from "vitest";
import Home from "../page";

describe("Home page", () => {
  beforeAll(() => {
    // jsdom does not implement EventSource
    class FakeEventSource {
      onmessage!: (event: MessageEvent) => void;
      close() {}
    }
    (global as Record<string, unknown>).EventSource =
      FakeEventSource as unknown as typeof EventSource;
  });

  it("redirects to /cases", () => {
    try {
      Home();
    } catch (err) {
      expect((err as { digest?: string }).digest).toContain("/cases");
      return;
    }
    throw new Error("Expected redirect");
  });
});
