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

vi.mock("is-mobile", () => ({ default: () => true }));

describe("CaseChat body scroll lock", () => {
  it("locks and restores body scroll", () => {
    document.body.style.overflow = "auto";
    document.body.style.height = "";
    const { getByText, getByLabelText } = render(<CaseChat caseId="1" />);
    fireEvent.click(getByText("Chat"));
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.height).toBe("100dvh");
    fireEvent.click(getByLabelText("Close chat"));
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.height).toBe("");
  });
});
