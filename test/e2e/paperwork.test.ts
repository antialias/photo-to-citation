import { afterAll, beforeAll, describe, expect, it, test, vi } from "vitest";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";

let ocrPaperwork: typeof import("@/lib/openai").ocrPaperwork;

let stub: OpenAIStub;

beforeAll(async () => {
  stub = await startOpenAIStub(["owner joe", { callsToAction: ["pay"] }]);
  process.env.OPENAI_BASE_URL = stub.url;
  process.env.OPENAI_API_KEY = "test";
  const mod = await import("@/lib/openai");
  ocrPaperwork = mod.ocrPaperwork;
});

afterAll(async () => {
  await stub.close();
  process.env.OPENAI_BASE_URL = undefined;
  process.env.OPENAI_API_KEY = undefined;
});

describe("paperwork info", () => {
  it("extracts calls to action", async () => {
    const result = await ocrPaperwork({ url: "data:image/png;base64,foo" });
    expect(result).toEqual({
      text: "owner joe",
      info: { callsToAction: ["pay"], vehicle: {} },
    });
    expect(stub.requests.length).toBe(2);
  });
});
