import type { useSession as useSessionFn } from "@/app/useSession";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/useSession", () => ({
  useSession: vi.fn(
    () =>
      ({
        data: { user: { role: "admin" }, expires: "0" },
      }) as unknown as ReturnType<typeof useSessionFn>,
  ),
}));

import { useSession } from "@/app/useSession";

vi.mock("@/apiClient", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/apiClient";
import AdminPageClient from "@/app/admin/AdminPageClient";

const users = [{ id: "1", email: "a@example.com", name: null, role: "admin" }];
const rules = [{ ptype: "p", v0: "admin", v1: "users", v2: "read" }];

describe("AdminPageClient", () => {
  it("renders users and rules", () => {
    render(<AdminPageClient initialUsers={users} initialRules={rules} />);
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin")).toBeInTheDocument();
    expect(screen.getByText(/p, admin, users/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save rules/i })).toBeDisabled();
  });

  it("enables saving for superadmins", async () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: { user: { role: "superadmin" }, expires: "0" },
    } as unknown as ReturnType<typeof useSessionFn>);
    render(<AdminPageClient initialUsers={users} initialRules={rules} />);
    expect(
      screen.getByRole("button", { name: /save rules/i }),
    ).not.toBeDisabled();
  });

  it("updates user role without reload", async () => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValueOnce(
      new Response(null, { status: 200 }),
    );
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "1", email: "a@example.com", name: null, role: "user" },
      ],
    } as Response);
    render(<AdminPageClient initialUsers={users} initialRules={rules} />);
    fireEvent.change(screen.getByDisplayValue("admin"), {
      target: { value: "user" },
    });
    await waitFor(() =>
      expect(screen.getByDisplayValue("user")).toBeInTheDocument(),
    );
  });

  it("reloads policies after save", async () => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(useSession).mockReturnValueOnce({
      data: { user: { role: "superadmin" }, expires: "0" },
    } as unknown as ReturnType<typeof useSessionFn>);
    const newRules = [{ ptype: "p", v0: "user", v1: "cases", v2: "read" }];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => newRules,
    } as Response);
    render(<AdminPageClient initialUsers={users} initialRules={rules} />);
    fireEvent.change(screen.getAllByRole("textbox")[1], {
      target: { value: JSON.stringify(newRules, null, 2) },
    });
    fireEvent.click(screen.getByRole("button", { name: /save rules/i }));
    await waitFor(() =>
      expect(
        screen.getByText((t) => t.includes("user") && t.includes("cases")),
      ).toBeInTheDocument(),
    );
  });
});
