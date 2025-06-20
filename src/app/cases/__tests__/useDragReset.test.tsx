import useDragReset from "@/app/cases/useDragReset";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("useDragReset", () => {
  it("invokes reset on dragleave with no relatedTarget", () => {
    const fn = vi.fn();
    renderHook(() => useDragReset(fn));
    const leave = new Event("dragleave");
    Object.defineProperty(leave, "relatedTarget", { value: null });
    window.dispatchEvent(leave);
    expect(fn).toHaveBeenCalled();
  });

  it("invokes reset on dragend", () => {
    const fn = vi.fn();
    renderHook(() => useDragReset(fn));
    window.dispatchEvent(new Event("dragend"));
    expect(fn).toHaveBeenCalled();
  });
});
