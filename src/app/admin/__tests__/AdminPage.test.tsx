import { getServerSession } from "next-auth/next";
import { describe, expect, it, vi } from "vitest";
import AdminPage from "../page";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authz", () => ({
  withAuthorization: (_o: string, _a: string, h: unknown) => h,
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
