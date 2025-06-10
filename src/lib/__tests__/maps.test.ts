import { describe, expect, it } from "vitest";
import { getStaticMapUrl } from "../maps";

describe("getStaticMapUrl", () => {
  it("creates a google maps url", () => {
    const url = getStaticMapUrl(
      { lat: 1, lon: 2 },
      { width: 100, height: 50, zoom: 10 },
    );
    expect(url).toContain("maps.googleapis.com");
    expect(url).toContain("center=1%2C2");
  });
});
