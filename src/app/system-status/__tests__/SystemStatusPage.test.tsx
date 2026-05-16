import SystemStatusPage from "@/app/system-status/page";
import { requirePageAuthorization } from "@/lib/authz";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/authz", () => ({
  requirePageAuthorization: vi.fn(),
}));

it("denies non-superadmin via notFound()", async () => {
  // requirePageAuthorization calls Next's notFound() on denial, which throws.
  (
    requirePageAuthorization as unknown as {
      mockRejectedValue: (v: unknown) => void;
    }
  ).mockRejectedValue(new Error("NEXT_NOT_FOUND"));
  await expect(SystemStatusPage()).rejects.toThrow("NEXT_NOT_FOUND");
});

it("renders for superadmin", async () => {
  (
    requirePageAuthorization as unknown as {
      mockResolvedValue: (v: unknown) => void;
    }
  ).mockResolvedValue({ role: "superadmin" });
  const res = await SystemStatusPage();
  expect(res).not.toBeInstanceOf(Response);
});
