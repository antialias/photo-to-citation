import type { ChatCompletion } from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";
import { ocrPaperwork, openai } from "../openai";

describe("openai client", () => {
  it("exports a client instance", () => {
    expect(openai).toBeDefined();
  });

  it("ocrPaperwork returns text", async () => {
    vi.spyOn(openai.chat.completions, "create").mockResolvedValueOnce({
      choices: [{ message: { content: "hello" } }],
    } as unknown as ChatCompletion);
    const text = await ocrPaperwork({ url: "data:image/png;base64,foo" });
    expect(text).toBe("hello");
  });
});
