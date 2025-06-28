import I18nProvider from "@/app/i18n-provider";
import QueryProvider from "@/app/query-provider";
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
  it("shows point and shoot link on normal pages", async () => {
    mockedUsePathname.mockReturnValue("/cases");
    render(
      <QueryProvider>
        <I18nProvider lang="en">
          <NavBar />
        </I18nProvider>
      </QueryProvider>,
    );
    expect(await screen.findByText("Point & Shoot")).toBeInTheDocument();
    expect(await screen.findByText("Map View")).toBeInTheDocument();
  });

  it("hides the nav except for cases on /point", async () => {
    mockedUsePathname.mockReturnValue("/point");
    render(
      <QueryProvider>
        <I18nProvider lang="en">
          <NavBar />
        </I18nProvider>
      </QueryProvider>,
    );
    expect(screen.queryByText("Point & Shoot")).toBeNull();
    expect(await screen.findByText("Cases")).toBeInTheDocument();
  });
});
