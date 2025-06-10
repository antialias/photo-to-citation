import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import Home from "../page";

describe("Home page", () => {
  it("renders main navigation links", () => {
    render(<Home />);
    expect(screen.getByText("Upload a Photo")).toBeInTheDocument();
    expect(screen.getByText("View Cases")).toBeInTheDocument();
  });
});
