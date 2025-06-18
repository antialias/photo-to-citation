import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignInPage from "../page";

vi.mock("../../useSession", () => ({
  signIn: vi.fn(),
}));

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

describe("SignInPage", () => {
  it("shows error message from query", () => {
    mockGet.mockReturnValueOnce("some-error");
    render(<SignInPage />);
    expect(
      screen.getByText(/Sign-in failed. The link may have expired./i),
    ).toBeInTheDocument();
  });
});
