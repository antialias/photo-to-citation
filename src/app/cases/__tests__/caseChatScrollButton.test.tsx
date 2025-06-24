import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({ ok: true, json: async () => ({ photos: [] }) })),
);

describe("CaseChat scroll button", () => {
  it("shows button when input focused", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <CaseChat caseId="1" />,
    );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.focus(input);
    expect(getByText("Jump to latest")).toBeTruthy();
    fireEvent.blur(input);
    expect(queryByText("Jump to latest")).toBeNull();
  });
});
