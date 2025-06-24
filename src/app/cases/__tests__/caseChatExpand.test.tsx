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
  it("toggles expanded state", () => {
    const { getByText, getByLabelText } = render(<CaseChat caseId="1" />);
    fireEvent.click(getByText("Chat"));
    const expandBtn = getByLabelText("Expand chat");
    fireEvent.click(expandBtn);
    expect(getByLabelText("Collapse chat")).toBeTruthy();
    fireEvent.click(getByLabelText("Collapse chat"));
    expect(getByLabelText("Expand chat")).toBeTruthy();
  });
});
