import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { gatherSpecs } from "../scripts/generateWebsiteImages";

describe("gatherSpecs", () => {
  it("extracts basic attributes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "imgspec-"));
    fs.writeFileSync(
      path.join(dir, "index.md"),
      '<img src="autogen/foo.png" alt="prompt" width="1234" height="5678" data-image-gen />',
    );
    const specs = gatherSpecs(dir);
    expect(specs.length).toBe(1);
    const spec = specs[0];
    expect(spec.file).toBe("autogen/foo.png");
    expect(spec.width).toBe(1234);
    expect(spec.height).toBe(5678);
    expect(spec.args.prompt).toBe("prompt");
    expect(spec.args.size).toBe("1234x5678");
    expect(spec.args.model).toBe("dall-e-3");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("handles json overrides and templated src", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "imgspec-"));
    fs.writeFileSync(
      path.join(dir, "page.md"),
      `<img src="{{ '/images/bar.png' | url }}" alt="another" width="50" data-image-gen='{"model":"gpt-image-1","size":"1024x1536"}' />`,
    );
    const [spec] = gatherSpecs(dir);
    expect(spec.file).toBe("images/bar.png");
    expect(spec.args.model).toBe("gpt-image-1");
    expect(spec.args.size).toBe("1024x1536");
    expect(spec.width).toBe(50);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
