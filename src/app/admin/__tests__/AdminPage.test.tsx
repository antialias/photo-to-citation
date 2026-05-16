import AdminPage from "@/app/admin/page";
import { requirePageAuthorization } from "@/lib/authz";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/authz", () => ({
  requirePageAuthorization: vi.fn(),
}));

vi.mock("@/lib/adminStore", () => ({
  listUsers: () => [],
  getCasbinRules: () => [],
}));

it("denies non-admin via notFound()", async () => {
  // requirePageAuthorization calls Next's notFound() on denial, which throws.
  (
    requirePageAuthorization as unknown as {
      mockRejectedValue: (v: unknown) => void;
    }
  ).mockRejectedValue(new Error("NEXT_NOT_FOUND"));
  await expect(
    AdminPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow("NEXT_NOT_FOUND");
});

it("renders for admin", async () => {
  (
    requirePageAuthorization as unknown as {
      mockResolvedValue: (v: unknown) => void;
    }
  ).mockResolvedValue({ role: "admin" });
  const res = await AdminPage({ searchParams: Promise.resolve({}) });
  expect(res).not.toBeInstanceOf(Response);
});
