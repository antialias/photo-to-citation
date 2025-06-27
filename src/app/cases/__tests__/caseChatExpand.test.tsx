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

const matchMediaStub = vi.fn().mockImplementation(() => ({
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
}));
vi.stubGlobal("matchMedia", matchMediaStub);

describe("CaseChat expanded view", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("toggles expanded state on desktop", () => {
    const { getByText, getByLabelText } = render(<CaseChat caseId="1" />);
    fireEvent.click(getByText("Chat"));
    const expandBtn = getByLabelText("Expand chat");
    fireEvent.click(expandBtn);
    expect(getByLabelText("Collapse chat")).toBeTruthy();
    fireEvent.click(getByLabelText("Collapse chat"));
    expect(getByLabelText("Expand chat")).toBeTruthy();
  });

  it("hides expand button on mobile", () => {
    matchMediaStub.mockImplementationOnce(() => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { getByText, queryByLabelText } = render(<CaseChat caseId="1" />);
    fireEvent.click(getByText("Chat"));
    expect(queryByLabelText("Expand chat")).toBeNull();
  });
});
