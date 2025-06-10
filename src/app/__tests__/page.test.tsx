import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import Home from "../page";

describe("Home page", () => {
  beforeAll(() => {
    // jsdom does not implement EventSource
    class FakeEventSource {
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      onmessage: any;
      close() {}
    }
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    (global as any).EventSource = FakeEventSource;
  });

  it("shows the cases list", () => {
    render(<Home />);
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });
});
