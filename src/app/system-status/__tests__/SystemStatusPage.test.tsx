import { getServerSession } from "next-auth/next";
import { expect, it, vi } from "vitest";

const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authz", () => ({
  authorize: vi.fn((role: string) => role === "superadmin"),
}));

it("returns 404 for non-superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "admin" },
  });
  const { default: Page } = await import("@/app/system-status/page");
  await Page();
  expect(mockNotFound).toHaveBeenCalled();
});

it("renders for superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "superadmin" },
  });
  const { default: Page } = await import("@/app/system-status/page");
  const res = await Page();
  expect(res).not.toBeInstanceOf(Response);
});
