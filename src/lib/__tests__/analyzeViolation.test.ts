import type { ChatCompletion } from "openai/resources/chat/completions";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalysisError, analyzeViolation, openai } from "../openai";

const imgs = [{ url: "data:image/png;base64,AA", filename: "foo.png" }];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("analyzeViolation", () => {
  it("classifies cut off responses", async () => {
    vi.spyOn(openai.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{" }, finish_reason: "length" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs)).rejects.toMatchObject({
      kind: "truncated",
    });
  });

  it("classifies parse failures", async () => {
    vi.spyOn(openai.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "oops" }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs)).rejects.toMatchObject({
      kind: "parse",
    });
  });

  it("classifies schema mismatches", async () => {
    vi.spyOn(openai.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs)).rejects.toMatchObject({
      kind: "schema",
    });
  });
});
