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

describe("CaseChat persistence", () => {
  it("saves current chat when switching sessions", async () => {
    localStorage.clear();
    const { getByText, getByLabelText, getByPlaceholderText, findByText } =
      render(
        <CaseChat
          caseId="1"
          onChat={async () => ({
            reply: {
              response: { en: "ok" },
              actions: [],
              noop: false,
            },
          })}
        />,
      );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await findByText("ok");
    const select = getByLabelText("Chat history") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    fireEvent.change(select, { target: { value: "new" } });
    const stored = JSON.parse(localStorage.getItem("case-chat-1") || "[]");
    expect(stored.length).toBe(1);
    expect(select.options.length).toBe(3);
  });

  it("saves chat on unmount", async () => {
    localStorage.clear();
    const { getByText, getByPlaceholderText, findByText, unmount } = render(
      <CaseChat
        caseId="1"
        onChat={async () => ({
          reply: {
            response: { en: "ok" },
            actions: [],
            noop: false,
            lang: "en",
          },
        })}
      />,
    );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "Bye" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await findByText("ok");
    unmount();
    const stored = JSON.parse(localStorage.getItem("case-chat-1") || "[]");
    expect(stored.length).toBe(1);
    expect(stored[0].messages[0].content).toBe("Bye");
  });
});
