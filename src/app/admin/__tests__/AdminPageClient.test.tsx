import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminPageClient from "../AdminPageClient";

const users = [{ id: "1", email: "a@example.com", name: null, role: "admin" }];
const rules = [{ ptype: "p", v0: "admin", v1: "users", v2: "read" }];

describe("AdminPageClient", () => {
  it("renders users and rules", () => {
    render(<AdminPageClient initialUsers={users} initialRules={rules} />);
    expect(screen.getByText("a@example.com (admin)")).toBeInTheDocument();
    expect(screen.getByText(/p, admin, users/)).toBeInTheDocument();
  });
});
