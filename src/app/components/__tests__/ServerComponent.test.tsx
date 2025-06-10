import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import ServerComponent from "../ServerComponent";

describe("ServerComponent", () => {
  it("renders text", async () => {
    const element = await ServerComponent();
    render(element);
    expect(screen.getByText("Server Component")).toBeInTheDocument();
  });
});
