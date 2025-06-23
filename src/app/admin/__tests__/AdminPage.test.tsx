import AdminPage from "@/app/admin/page";
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

it("returns 403 for non-admin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "user" },
  });
  (
    (await import("@/lib/authz")) as {
      authorize: { mockResolvedValue: (v: unknown) => void };
    }
  ).authorize.mockResolvedValue(false);
  await expect(AdminPage()).rejects.toThrow();
});
