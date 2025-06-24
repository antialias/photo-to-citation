import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    ok: true,
    json: async () => ({
      id: "1",
      photos: ["/uploads/foo.jpg"],
      photoTimes: {},
      createdAt: "",
      updatedAt: "",
      analysisStatus: "pending",
      public: false,
      closed: false,
    }),
  })),
);

describe("CaseChat input focus", () => {
  it("focuses the input when opened", () => {
    const { getByText, getByPlaceholderText } = render(<CaseChat caseId="1" />);
    const button = getByText("Chat");
    fireEvent.click(button);
    const input = getByPlaceholderText("Ask a question...") as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });
});
