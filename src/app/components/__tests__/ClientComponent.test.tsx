import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import ClientComponent from "../ClientComponent";

describe("ClientComponent", () => {
  it("renders text", () => {
    render(<ClientComponent />);
    expect(screen.getByText("Client Component")).toBeInTheDocument();
  });
});
