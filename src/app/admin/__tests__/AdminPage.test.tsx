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
  withAuthorization: (_opts: unknown, h: unknown) => h,
}));

it("returns 403 for non-admin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "user" },
  });
  const res = (await AdminPage()) as Response;
  expect(res.status).toBe(403);
});
