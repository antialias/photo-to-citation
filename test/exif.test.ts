import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { extractGps } from "../src/lib/exif";

const starfish = fs.readFileSync("node_modules/exif-parser/test/starfish.jpg");

describe("extractGps", () => {
  it("parses lat and lon from exif data", () => {
    const gps = extractGps(starfish);
    expect(gps).toBeDefined();
    expect(gps?.lat).toBeCloseTo(55.0387, 3);
    expect(gps?.lon).toBeCloseTo(8.45719, 3);
  });

  it("returns null when data has no exif", () => {
    const gps = extractGps(Buffer.from("no exif"));
    expect(gps).toBeNull();
  });
});
