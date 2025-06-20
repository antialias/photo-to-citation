import ServerComponent from "@/app/components/ServerComponent";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ServerComponent", () => {
  it("renders text", async () => {
    const element = await ServerComponent();
    render(element);
    expect(screen.getByText("Server Component")).toBeInTheDocument();
  });
});
