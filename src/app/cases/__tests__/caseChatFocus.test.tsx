import CaseChat from "@/app/cases/[id]/CaseChat";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("CaseChat input focus", () => {
  it("focuses the input when opened", () => {
    const { getByText, getByPlaceholderText } = render(<CaseChat caseId="1" />);
    const button = getByText("Chat");
    fireEvent.click(button);
    const input = getByPlaceholderText("Ask a question...") as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });
});
