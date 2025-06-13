import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vcode-"));
  process.env.VIOLATION_CODE_FILE = path.join(dataDir, "codes.json");
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  process.env.VIOLATION_CODE_FILE = undefined;
  vi.resetModules();
});

describe("getViolationCode", () => {
  it("uses llm when missing and caches result", async () => {
    const mod = await import("../src/lib/violationCodes");
    const { client } = (await import("../src/lib/llm")).getLlm("lookup_code");
    vi.spyOn(client.chat.completions, "create").mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ code: "A1" }) } }],
    } as unknown as ChatCompletion);
    const code = await mod.getViolationCode("oak-park", "parking");
    expect(code).toBe("A1");
    const stored = JSON.parse(
      fs.readFileSync(process.env.VIOLATION_CODE_FILE ?? "", "utf8"),
    );
    expect(stored["oak-park"].parking).toBe("A1");
  });

  it("returns cached code without llm call", async () => {
    fs.writeFileSync(
      process.env.VIOLATION_CODE_FILE ?? "",
      JSON.stringify({ "oak-park": { parking: "B2" } }, null, 2),
    );
    const mod = await import("../src/lib/violationCodes");
    const { client } = (await import("../src/lib/llm")).getLlm("lookup_code");
    const spy = vi.spyOn(client.chat.completions, "create");
    const code = await mod.getViolationCode("oak-park", "parking");
    expect(code).toBe("B2");
    expect(spy).not.toHaveBeenCalled();
  });
});
