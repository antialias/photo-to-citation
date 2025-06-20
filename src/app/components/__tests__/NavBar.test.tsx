import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockedUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockedUsePathname(),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/components/useNewCaseFromFiles", () => ({
  default: () => async () => {},
}));

import NavBar from "@/app/components/NavBar";
vi.mock("@/app/useSession", () => ({
  useSession: () => ({ data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("NavBar", () => {
  it("shows point and shoot link on normal pages", () => {
    mockedUsePathname.mockReturnValue("/cases");
    render(<NavBar />);
    expect(screen.getByText("Point & Shoot")).toBeInTheDocument();
    expect(screen.getByText("Map View")).toBeInTheDocument();
  });

  it("hides the nav except for cases on /point", () => {
    mockedUsePathname.mockReturnValue("/point");
    render(<NavBar />);
    expect(screen.queryByText("Point & Shoot")).toBeNull();
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });
});
