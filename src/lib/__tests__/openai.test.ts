import type { ChatCompletion } from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";
import { ocrPaperwork, openai } from "../openai";

describe("openai client", () => {
  it("exports a client instance", () => {
    expect(openai).toBeDefined();
  });

  it("ocrPaperwork returns text and info", async () => {
    vi.spyOn(openai.chat.completions, "create")
      .mockResolvedValueOnce({
        choices: [{ message: { content: "hello" } }],
      } as unknown as ChatCompletion)
      .mockResolvedValueOnce({
        choices: [{ message: { content: "{}" } }],
      } as unknown as ChatCompletion);
    const result = await ocrPaperwork({ url: "data:image/png;base64,foo" });
    expect(result).toEqual({ text: "hello", info: { vehicle: {} } });
  });
});
