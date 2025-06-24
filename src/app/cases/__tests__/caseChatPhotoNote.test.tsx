import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo | URL) => {
    if ((input as string).includes("/api/cases/1")) {
      return {
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
      } as Response;
    }
    return { ok: true, json: async () => ({ reply: "" }) } as Response;
  }),
);

describe("CaseChat photo note token", () => {
  it("renders photo note button", async () => {
    const { getByText, getByPlaceholderText, findByText } = render(
      <CaseChat caseId="1" onChat={async () => "[photo-note:foo.jpg=test]"} />,
    );
    fireEvent.click(getByText("Chat"));
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    const button = await findByText(/Add note to foo.jpg/);
    expect(button).toBeInTheDocument();
  });
});
