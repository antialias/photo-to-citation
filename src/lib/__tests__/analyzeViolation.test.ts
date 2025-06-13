import type { ChatCompletion } from "openai/resources/chat/completions";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLlm } from "../llm";
import { analyzeViolation } from "../openai";

const imgs = [{ url: "data:image/png;base64,AA", filename: "foo.png" }];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("analyzeViolation", () => {
  it("rejects when no images are provided", async () => {
    await expect(analyzeViolation([])).rejects.toMatchObject({
      kind: "images",
    });
  });
  it("classifies cut off responses", async () => {
    const { client } = getLlm("analyze_images");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{" }, finish_reason: "length" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs)).rejects.toMatchObject({
      kind: "truncated",
    });
  });

  it("classifies parse failures", async () => {
    const { client } = getLlm("analyze_images");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "oops" }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs)).rejects.toMatchObject({
      kind: "parse",
    });
  });

  it("classifies schema mismatches", async () => {
    const { client } = getLlm("analyze_images");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs)).rejects.toMatchObject({
      kind: "schema",
    });
  });
});
