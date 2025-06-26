import queryClient from "@/app/queryClient";
import type { useSession as useSessionFn } from "@/app/useSession";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
const rules = [
  { id: "rule1", ptype: "p", v0: "admin", v1: "users", v2: "read" },
];

afterEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe("AdminPageClient", () => {
  it("renders users and rules", () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => users,
    } as Response);
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPageClient initialUsers={users} initialRules={rules} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("admin")[0]).toBeInTheDocument();
    expect(screen.getByDisplayValue("users")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save rules/i })).toBeDisabled();
  });

  it("enables saving for superadmins", async () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: { user: { role: "superadmin" }, expires: "0" },
    } as unknown as ReturnType<typeof useSessionFn>);
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => users,
    } as Response);
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPageClient initialUsers={users} initialRules={rules} />
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole("button", { name: /save rules/i }),
    ).not.toBeDisabled();
  });

  it("updates user role without reload", async () => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => users,
    } as Response);
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => undefined,
    } as Response); // invite or disable call
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "1", email: "a@example.com", name: null, role: "user" },
      ],
    } as Response);
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPageClient initialUsers={users} initialRules={rules} />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getAllByDisplayValue("admin")[0], {
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
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => users,
    } as Response);
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const newRules = [
      { id: "rule2", ptype: "p", v0: "user", v1: "cases", v2: "read" },
    ];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => newRules,
    } as Response);
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPageClient initialUsers={users} initialRules={rules} />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getAllByDisplayValue("admin")[1], {
      target: { value: "user" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save rules/i }));
    await waitFor(() =>
      expect(screen.getByDisplayValue("user")).toBeInTheDocument(),
    );
  });

  it("asks for confirmation if edit access would be removed", async () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: { user: { role: "superadmin" }, expires: "0" },
    } as unknown as ReturnType<typeof useSessionFn>);
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => users,
    } as Response);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPageClient initialUsers={users} initialRules={rules} />
      </QueryClientProvider>,
    );
    expect(apiFetch).toHaveBeenCalledTimes(1); // initial users fetch
    fireEvent.click(screen.getByRole("button", { name: /save rules/i }));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
