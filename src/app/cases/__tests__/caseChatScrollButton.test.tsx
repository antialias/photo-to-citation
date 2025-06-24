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

describe("CaseChat scroll button", () => {
  it("shows button when scrolled away from bottom", () => {
    const { getByText, queryByText, container } = render(
      <CaseChat caseId="1" />,
    );
    fireEvent.click(getByText("Chat"));
    const scroll = container.querySelector(
      "div.overflow-y-auto",
    ) as HTMLDivElement;
    Object.defineProperty(scroll, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(scroll, "clientHeight", {
      value: 100,
      configurable: true,
    });
    scroll.scrollTop = 0;
    fireEvent.scroll(scroll);
    expect(getByText("Jump to latest")).toBeTruthy();
    scroll.scrollTop = 900;
    fireEvent.scroll(scroll);
    expect(queryByText("Jump to latest")).toBeNull();
  });
});
