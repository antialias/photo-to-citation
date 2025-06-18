import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../useSession", () => ({
  useSession: vi.fn(() => ({ data: { user: { role: "admin" } } })),
}));

import { useSession } from "../../useSession";

import AdminPageClient from "../AdminPageClient";

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
    useSession.mockReturnValueOnce({ data: { user: { role: "superadmin" } } });
    render(<AdminPageClient initialUsers={users} initialRules={rules} />);
    expect(
      screen.getByRole("button", { name: /save rules/i }),
    ).not.toBeDisabled();
  });
});
