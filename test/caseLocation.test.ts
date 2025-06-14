import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computeBestGps } from "../src/lib/caseLocation";
import type { Case } from "../src/lib/caseStore";

let cwd: string;
let dir: string;

beforeEach(() => {
  cwd = process.cwd();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "gps-"));
  process.chdir(dir);
  fs.mkdirSync("public/uploads", { recursive: true });
  fs.copyFileSync(
    path.join(cwd, "node_modules/exif-parser/test/starfish.jpg"),
    "public/uploads/starfish.jpg",
  );
  fs.copyFileSync(
    path.join(cwd, "node_modules/exif-parser/test/test.jpg"),
    "public/uploads/test.jpg",
  );
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("computeBestGps", () => {
  it("selects gps from highest scoring photo", () => {
    const caseData = {
      id: "1",
      photos: ["/uploads/test.jpg", "/uploads/starfish.jpg"],
      photoTimes: {},
      createdAt: "2020-01-01T00:00:00.000Z",
      analysis: {
        images: {
          "test.jpg": { representationScore: 0.2, violation: true },
          "starfish.jpg": { representationScore: 0.9, violation: true },
        },
      },
    } as unknown as Case;
    const gps = computeBestGps(caseData);
    expect(gps).toBeDefined();
    expect(gps?.lat).toBeCloseTo(55.0387, 3);
    expect(gps?.lon).toBeCloseTo(8.45719, 3);
  });
});
