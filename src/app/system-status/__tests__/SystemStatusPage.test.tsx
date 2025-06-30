import SystemStatusPage from "@/app/system-status/page";
import { getServerSession } from "next-auth/next";
import { expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/authOptions", () => ({
  getAuthOptions: () => ({}),
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
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "admin" },
  });
  const res = (await SystemStatusPage()) as Response;
  expect(res.status).toBe(403);
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
