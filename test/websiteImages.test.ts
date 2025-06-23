import { describe, expect, it } from "vitest";
import { parseSpecs } from "../scripts/generateWebsiteImages";

describe("parseSpecs", () => {
  it("extracts image specs from markdown", () => {
    const md = `<img src="autogen/test.png" alt="a cat" width="32" height="32" data-image-gen />`;
    const specs = parseSpecs(md);
    expect(specs).toEqual([
      {
        file: "autogen/test.png",
        prompt: "a cat",
        width: 32,
        height: 32,
        options: {},
      },
    ]);
  });

  it("parses json options", () => {
    const md = `<img src="img.png" alt="p" data-image-gen='{"model":"gpt-image-1"}' />`;
    const specs = parseSpecs(md);
    expect(specs[0].options.model).toBe("gpt-image-1");
  });
});
