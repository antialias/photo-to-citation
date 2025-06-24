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

describe("CaseChat history", () => {
  it("saves chat to localStorage", async () => {
    localStorage.clear();
    const { getByText, getByPlaceholderText, getByLabelText, findByText } =
      render(
        <CaseChat
          caseId="1"
          onChat={async () => ({
            reply: { response: "ok", actions: [], noop: false },
          })}
        />,
      );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await findByText("ok");
    fireEvent.click(getByLabelText("Close chat"));
    fireEvent.click(getByText("Chat"));
    const select = getByLabelText("Chat history") as HTMLSelectElement;
    expect(select.options.length).toBe(3);
  });
});
