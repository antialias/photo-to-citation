import I18nProvider from "@/app/i18n-provider";
import PointAndShootPage from "@/app/point/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/app/useNewCaseFromFiles", () => ({
  default: () => async () => {},
}));

vi.mock("@/app/useAddFilesToCase", () => ({
  default: () => async () => {},
}));

describe("Point and Shoot page", () => {
  it("renders link to cases", () => {
    render(
      <I18nProvider lang="en">
        <PointAndShootPage />
      </I18nProvider>,
    );
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });

  it("shows default hint when nothing detected", () => {
    render(
      <I18nProvider lang="en">
        <PointAndShootPage />
      </I18nProvider>,
    );
    expect(screen.getByText("Nothing has been detected")).toBeInTheDocument();
  });
});
