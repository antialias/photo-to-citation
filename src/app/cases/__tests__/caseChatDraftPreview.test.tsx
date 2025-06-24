import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("CaseChat draft preview", () => {
  it("shows draft preview when compose action clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/report")) {
          return {
            ok: true,
            json: async () => ({
              email: { subject: "S", body: "B" },
              attachments: [],
              module: "mod",
            }),
          } as Response;
        }
        return { ok: true, json: async () => ({ photos: [] }) } as Response;
      }),
    );
    const { getByText, getByPlaceholderText, findByText } = render(
      <CaseChat caseId="1" onChat={async () => "[action:compose]"} />,
    );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    const composeBtn = await findByText("Draft Report");
    fireEvent.click(composeBtn);
    await waitFor(() =>
      expect(
        getByText("Drafting email based on case information..."),
      ).toBeTruthy(),
    );
  });
});
