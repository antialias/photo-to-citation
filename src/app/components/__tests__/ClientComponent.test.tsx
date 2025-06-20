import ClientComponent from "@/app/components/ClientComponent";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("ClientComponent", () => {
  it("renders text", () => {
    render(<ClientComponent />);
    expect(screen.getByText("Client Component")).toBeInTheDocument();
  });
});
