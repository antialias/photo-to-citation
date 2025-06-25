import { constrainPan } from "@/app/components/ZoomableImage";
import { describe, expect, it } from "vitest";

describe("constrainPan", () => {
  it("clamps translation when image larger than container", () => {
    const container = { width: 200, height: 100 };
    const natural = { width: 200, height: 100 };
    expect(constrainPan(container, natural, { scale: 2, x: 100, y: 0 }).x).toBe(
      0,
    );
    expect(
      constrainPan(container, natural, { scale: 2, x: -300, y: 0 }).x,
    ).toBe(-200);
    expect(constrainPan(container, natural, { scale: 2, x: 0, y: 100 }).y).toBe(
      0,
    );
    expect(
      constrainPan(container, natural, { scale: 2, x: 0, y: -150 }).y,
    ).toBe(-100);
  });

  it("centers image when smaller than container", () => {
    const container = { width: 200, height: 200 };
    const natural = { width: 100, height: 100 };
    const t = constrainPan(container, natural, { scale: 1, x: 50, y: -50 });
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  it("handles differing aspect ratios", () => {
    const container = { width: 200, height: 200 };
    const natural = { width: 400, height: 200 };
    const t1 = constrainPan(container, natural, { scale: 1, x: -150, y: 0 });
    expect(t1.x).toBe(0);
    expect(t1.y).toBe(50);
    const t2 = constrainPan(container, natural, { scale: 1, x: 0, y: 100 });
    expect(t2.y).toBe(50);
  });
});
