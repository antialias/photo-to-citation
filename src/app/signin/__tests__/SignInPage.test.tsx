import SignInPage from "@/app/signin/page";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/useSession", () => ({
  signIn: vi.fn(),
}));
import { signIn } from "@/app/useSession";

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

describe("SignInPage", () => {
  it("shows configuration error message", () => {
    mockGet.mockReturnValueOnce("Configuration");
    render(<SignInPage />);
    expect(
      screen.getByText(
        /Configuration error\. NEXTAUTH_URL must match the site URL including any base path\./i,
      ),
    ).toBeInTheDocument();
  });

  it("shows generic error message for other errors", () => {
    mockGet.mockReturnValueOnce("other");
    render(<SignInPage />);
    expect(
      screen.getByText(/Sign-in failed. The link may have expired./i),
    ).toBeInTheDocument();
  });

  it("links to marketing website", () => {
    mockGet.mockReturnValueOnce(null);
    render(<SignInPage />);
    const link = screen.getByRole("link", {
      name: /learn more about photo to citation/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://antialias.github.io/photo-to-citation/website/",
    );
  });

  it("allows signing in with Google", () => {
    mockGet.mockReturnValueOnce(null);
    render(<SignInPage />);
    const btn = screen.getByRole("button", { name: /sign in with google/i });
    fireEvent.click(btn);
    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });
  });

  it("allows signing in with Facebook", () => {
    mockGet.mockReturnValueOnce(null);
    render(<SignInPage />);
    const btn = screen.getByRole("button", { name: /sign in with facebook/i });
    fireEvent.click(btn);
    expect(signIn).toHaveBeenCalledWith("facebook", { callbackUrl: "/" });
  });
});
