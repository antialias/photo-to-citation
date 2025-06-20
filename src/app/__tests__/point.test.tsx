import PointAndShootPage from "@/app/point/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/useNewCaseFromFiles", () => ({
  default: () => async () => {},
}));

describe("Point and Shoot page", () => {
  it("renders link to cases", () => {
    render(<PointAndShootPage />);
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });
});
