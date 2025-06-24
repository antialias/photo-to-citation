import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("CaseChat current session", () => {
  it("shows current chat option and updates summary", async () => {
    const { getByText, getByLabelText, getByPlaceholderText, findByText } =
      render(<CaseChat caseId="1" onChat={async () => "ok"} />);
    fireEvent.click(getByText("Chat"));
    const select = getByLabelText("Chat history") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    const currentValue = select.value;
    expect(currentValue).not.toBe("new");
    const input = getByPlaceholderText("Ask a question...");
    fireEvent.change(input, { target: { value: "Hello world" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await findByText("ok");
    const currentOption = Array.from(select.options).find(
      (o) => o.value === currentValue,
    );
    expect(currentOption?.textContent).toContain("Hello world");
  });
});
