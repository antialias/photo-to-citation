import SystemStatusPage from "@/app/system-status/page";
import { expect, it, vi } from "vitest";
import { SessionContext } from "../../server-context";

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authz", () => ({
  withAuthorization:
    (
      _opts: unknown,
      handler: (
        req: Request,
        ctx: { session?: { user?: { role?: string } } },
      ) => unknown,
    ) =>
    async (req: Request, ctx: { session?: { user?: { role?: string } } }) => {
      return ctx.session?.user?.role === "superadmin"
        ? handler(req, ctx)
        : new Response(null, { status: 403 });
    },
}));

it("returns 403 for non-superadmin", async () => {
  (SessionContext as unknown as { _currentValue: unknown })._currentValue = {
    user: { role: "admin" },
  };
  const res = (await SystemStatusPage()) as Response;
  expect(res.status).toBe(403);
});

it("renders for superadmin", async () => {
  (SessionContext as unknown as { _currentValue: unknown })._currentValue = {
    user: { role: "superadmin" },
  };
  const res = await SystemStatusPage();
  expect(res).not.toBeInstanceOf(Response);
});
