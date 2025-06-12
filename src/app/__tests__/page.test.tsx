import { render, screen } from "@testing-library/react";
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

  it("shows the cases list", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });
});
