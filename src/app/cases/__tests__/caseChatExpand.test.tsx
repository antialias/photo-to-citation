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

describe("CaseChat expanded view", () => {
  it("does not render expand button", () => {
    const { getByText, queryByLabelText } = render(<CaseChat caseId="1" />);
    fireEvent.click(getByText("Chat"));
    expect(queryByLabelText("Expand chat")).toBeNull();
  });
});
