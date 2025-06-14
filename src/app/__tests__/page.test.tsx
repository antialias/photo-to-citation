import { headers } from "next/headers";
import { beforeAll, describe, expect, it, vi } from "vitest";
import Home from "../page";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

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

  it("redirects mobile users to /point", async () => {
    (headers as vi.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Headers({
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        }),
      ),
    );
    try {
      await Home();
    } catch (err) {
      expect((err as { digest?: string }).digest).toContain("/point");
      return;
    }
    throw new Error("Expected redirect");
  });

  it("redirects desktop users to /cases", async () => {
    (headers as vi.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Headers({ "user-agent": "Mozilla/5.0 (X11; Linux x86_64)" }),
      ),
    );
    try {
      await Home();
    } catch (err) {
      expect((err as { digest?: string }).digest).toContain("/cases");
      return;
    }
    throw new Error("Expected redirect");
  });
});
