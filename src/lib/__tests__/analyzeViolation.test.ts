import { getLlm } from "@/lib/llm";
import { analyzeViolation } from "@/lib/openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { afterEach, describe, expect, it, vi } from "vitest";

const imgs = [{ url: "data:image/png;base64,AA", filename: "foo.png" }];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("analyzeViolation", () => {
  it("rejects when no images are provided", async () => {
    await expect(analyzeViolation([], "en")).rejects.toMatchObject({
      kind: "images",
    });
  });
  it("classifies cut off responses", async () => {
    const { client } = getLlm("analyze_images");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{" }, finish_reason: "length" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs, "en")).rejects.toMatchObject({
      kind: "truncated",
    });
  });

  it("classifies parse failures", async () => {
    const { client } = getLlm("analyze_images");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "oops" }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs, "en")).rejects.toMatchObject({
      kind: "parse",
    });
  });

  it("classifies schema mismatches", async () => {
    const { client } = getLlm("analyze_images");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs, "en")).rejects.toMatchObject({
      kind: "schema",
    });
  });

  it("rejects invalid license plate state", async () => {
    const { client } = getLlm("analyze_images");
    const reply = JSON.stringify({
      violationType: "parking",
      details: "",
      vehicle: { licensePlateNumber: "123", licensePlateState: "XX" },
      images: {},
    });
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: reply }, finish_reason: "stop" }],
    } as unknown as ChatCompletion);

    await expect(analyzeViolation(imgs, "en")).rejects.toMatchObject({
      kind: "schema",
    });
  });
});
