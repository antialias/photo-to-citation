import type { ChatCompletion } from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";
import { getLlm } from "../llm";
import { extractPaperworkInfo, ocrPaperwork } from "../openai";

describe("openai client", () => {
  it("provides a client instance", () => {
    const { client } = getLlm("ocr_paperwork");
    expect(client).toBeDefined();
  });

  it("ocrPaperwork returns text and info", async () => {
    const { client } = getLlm("ocr_paperwork");
    vi.spyOn(client.chat.completions, "create")
      .mockResolvedValueOnce({
        choices: [{ message: { content: "hello" } }],
      } as unknown as ChatCompletion)
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"callsToAction":["pay now"]}' } }],
      } as unknown as ChatCompletion);
    const result = await ocrPaperwork({ url: "data:image/png;base64,foo" });
    expect(result).toEqual({
      text: "hello",
      info: { vehicle: {}, callsToAction: ["pay now"] },
    });
  });
});
