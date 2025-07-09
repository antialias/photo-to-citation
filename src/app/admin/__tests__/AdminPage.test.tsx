import AdminPage from "@/app/admin/page";
import { expect, it, vi } from "vitest";
import { SessionContext } from "../../server-context";

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authz", () => ({
  withAuthorization: (_opts: unknown, h: unknown) => h,
}));

it("returns 403 for non-admin", async () => {
  (SessionContext as unknown as { _currentValue: unknown })._currentValue = {
    user: { role: "user" },
  };
  const res = (await AdminPage({
    searchParams: Promise.resolve({}),
  })) as Response;
  expect(res.status).toBe(403);
});
