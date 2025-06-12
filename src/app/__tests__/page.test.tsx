import { render, screen } from "@testing-library/react";
import React from "react";
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

  it.skip("shows the cases list", () => {
    render(<Home />);
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });
});
