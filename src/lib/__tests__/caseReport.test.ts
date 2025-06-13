import type { ChatCompletion } from "openai/resources/chat/completions";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftEmail, draftOwnerNotification } from "../caseReport";
import type { Case } from "../caseStore";
import { getLlm } from "../llm";
import { reportModules } from "../reportModules";

const baseCase: Case = {
  id: "1",
  photos: ["/foo.jpg"],
  photoTimes: { "/foo.jpg": "2020-01-01T00:00:00.000Z" },
  createdAt: "2020-01-01T00:00:00.000Z",
  gps: null,
  streetAddress: null,
  intersection: null,
  analysis: {
    violationType: "test",
    details: "details",
    vehicle: {},
    images: { "foo.jpg": { representationScore: 1, violation: true } },
  },
  analysisOverrides: null,
  analysisStatus: "complete",
  analysisStatusCode: 200,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("draftEmail", () => {
  it("returns parsed email when response is valid", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValueOnce({
      choices: [
        { message: { content: JSON.stringify({ subject: "s", body: "b" }) } },
      ],
    } as unknown as ChatCompletion);

    const result = await draftEmail(baseCase, reportModules["oak-park"]);
    expect(result).toEqual({ subject: "s", body: "b" });
  });

  it("retries when response is invalid", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create")
      .mockResolvedValueOnce({
        choices: [{ message: { content: "{}" } }],
      } as unknown as ChatCompletion)
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: JSON.stringify({ subject: "s2", body: "b2" }) },
          },
        ],
      } as unknown as ChatCompletion);

    const result = await draftEmail(baseCase, reportModules["oak-park"]);
    expect(result).toEqual({ subject: "s2", body: "b2" });
  });

  it("returns empty draft after repeated failures", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" } }],
    } as unknown as ChatCompletion);

    const result = await draftEmail(baseCase, reportModules["oak-park"]);
    expect(result).toEqual({ subject: "", body: "" });
  });
});

describe("draftOwnerNotification", () => {
  it("returns parsed email when response is valid", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValueOnce({
      choices: [
        { message: { content: JSON.stringify({ subject: "s", body: "b" }) } },
      ],
    } as unknown as ChatCompletion);

    const result = await draftOwnerNotification(baseCase, [
      "Oak Park Police Department",
    ]);
    expect(result).toEqual({ subject: "s", body: "b" });
  });

  it("retries when response is invalid", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create")
      .mockResolvedValueOnce({
        choices: [{ message: { content: "{}" } }],
      } as unknown as ChatCompletion)
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: JSON.stringify({ subject: "s2", body: "b2" }) },
          },
        ],
      } as unknown as ChatCompletion);

    const result = await draftOwnerNotification(baseCase, [
      "Oak Park Police Department",
    ]);
    expect(result).toEqual({ subject: "s2", body: "b2" });
  });

  it("returns empty draft after repeated failures", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" } }],
    } as unknown as ChatCompletion);

    const result = await draftOwnerNotification(baseCase, [
      "Oak Park Police Department",
    ]);
    expect(result).toEqual({ subject: "", body: "" });
  });
});
