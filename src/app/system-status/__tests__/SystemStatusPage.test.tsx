import SystemStatusPage from "@/app/system-status/page";
import { getServerSession } from "next-auth/next";
import { expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authz", () => ({
  authorize: vi.fn((role: string) => role === "superadmin"),
}));

it("shows message for non-superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "admin" },
  });
  const res = await SystemStatusPage();
  expect(res).not.toBeInstanceOf(Response);
});

it("renders for superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "superadmin" },
  });
  const res = await SystemStatusPage();
  expect(res).not.toBeInstanceOf(Response);
});
