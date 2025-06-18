import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { type Mock, beforeAll, describe, expect, it, vi } from "vitest";
import Home from "../page";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

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

  it("redirects mobile users to /point when signed in", async () => {
    (getServerSession as Mock).mockResolvedValueOnce({ user: {} });
    (headers as Mock).mockReturnValueOnce(
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

  it("renders landing page when logged out", async () => {
    (getServerSession as Mock).mockResolvedValueOnce(null);
    (headers as Mock).mockReturnValueOnce(
      Promise.resolve(
        new Headers({ "user-agent": "Mozilla/5.0 (X11; Linux x86_64)" }),
      ),
    );
    const res = await Home();
    expect(res).toBeTruthy();
  });
});
