import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const caseData = {
  photos: ["a.jpg"],
  photoNotes: {},
};

describe("CaseChat photo note action", () => {
  it("renders photo note button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => caseData })),
    );
    const { getByText, getByPlaceholderText, findByText } = render(
      <CaseChat
        caseId="1"
        onChat={async () => ({
          reply: {
            lang: "en",
            response: { en: "here" },
            actions: [{ photo: "a.jpg", note: "test" }],
            noop: false,
          },
        })}
      />,
    );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    const label = await findByText('Add "test"');
    const btn = label.closest("button") as HTMLButtonElement;
    expect(btn.querySelector("img")?.getAttribute("src")).toContain(
      "/uploads/thumbs/64/a.jpg",
    );
  });
});
