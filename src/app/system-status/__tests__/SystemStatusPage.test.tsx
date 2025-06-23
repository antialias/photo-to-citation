import SystemStatusPage from "@/app/system-status/page";
import { getServerSession } from "next-auth/next";
import type { ReactElement } from "react";
import { expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/authz", () => ({
  authorize: vi.fn(async (role: string) => role === "superadmin"),
  getSessionDetails: ({
    session,
  }: { session?: { user?: { role?: string } } }) => ({
    role: session?.user?.role ?? "anonymous",
    userId: session?.user?.id,
  }),
}));

it("renders access denied for non-superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "admin" },
  });
  const res = (await SystemStatusPage()) as ReactElement;
  expect(res).not.toBeInstanceOf(Response);
  expect(res.props.children).toBe("Access denied");
});

it("renders for superadmin", async () => {
  (
    getServerSession as unknown as { mockResolvedValue: (v: unknown) => void }
  ).mockResolvedValue({
    user: { role: "superadmin" },
  });
  const res = (await SystemStatusPage()) as ReactElement;
  expect(res).not.toBeInstanceOf(Response);
  expect(res.type).not.toBe("p");
});
