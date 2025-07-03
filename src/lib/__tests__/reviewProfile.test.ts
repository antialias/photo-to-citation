import { getLlm } from "@/lib/llm";
import { reviewProfileContent } from "@/lib/openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { describe, expect, it, vi } from "vitest";

describe("reviewProfileContent", () => {
  it("parses response", async () => {
    const { client } = getLlm("profile_review");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: '{"publish":false,"reason":"bad"}' } }],
    } as unknown as ChatCompletion);
    const result = await reviewProfileContent("bad text");
    expect(result).toEqual({ publish: false, reason: "bad" });
  });
});
