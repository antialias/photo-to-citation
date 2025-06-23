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
  authorize: vi.fn(),
}));

it("returns 403 for non-superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "admin" },
  });
  (
    (await import("@/lib/authz")) as {
      authorize: { mockResolvedValue: (v: unknown) => void };
    }
  ).authorize.mockResolvedValue(false);
  await expect(SystemStatusPage()).rejects.toThrow();
});

it("renders for superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "superadmin" },
  });
  (
    (await import("@/lib/authz")) as {
      authorize: { mockResolvedValue: (v: unknown) => void };
    }
  ).authorize.mockResolvedValue(true);
  const res = await SystemStatusPage();
  expect(res).not.toBeInstanceOf(Response);
});
