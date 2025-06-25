import CaseChat from "@/app/cases/[id]/CaseChat";
import QueryProvider from "@/app/query-provider";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const caseData = { photos: [] };

describe("CaseChat take photo action", () => {
  it("renders inline camera widget", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => caseData })),
    );
    (
      navigator as unknown as {
        mediaDevices: { getUserMedia: () => Promise<unknown> };
      }
    ).mediaDevices = {
      getUserMedia: vi.fn(async () => ({ getTracks: () => [] })),
    };
    Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
      writable: true,
      value: null,
    });
    const { getByText, getByPlaceholderText, findByText } = render(
      <QueryProvider>
        <CaseChat
          caseId="1"
          onChat={async () => ({
            reply: {
              response: "",
              actions: [{ id: "take-photo" }],
              noop: false,
            },
          })}
        />
      </QueryProvider>,
    );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    const actionBtn = await findByText("Take Photo");
    fireEvent.click(actionBtn);
    expect(await findByText("Take Case Photo")).toBeTruthy();
  });
});
