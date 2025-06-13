import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PointAndShootPage from "../point/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../useNewCaseFromFiles", () => ({
  default: () => async () => {},
}));

describe("Point and Shoot page", () => {
  it("renders link to cases", () => {
    render(<PointAndShootPage />);
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });
});
