import { draftEmail, draftOwnerNotification } from "@/lib/caseReport";
import type { Case } from "@/lib/caseStore";
import { getLlm } from "@/lib/llm";
import { reportModules } from "@/lib/reportModules";
import * as violationCodes from "@/lib/violationCodes";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const baseCase: Case = {
  id: "1",
  photos: ["/foo.jpg"],
  photoTimes: { "/foo.jpg": "2020-01-01T00:00:00.000Z" },
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
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
  public: false,
};

const sender = { name: "Test User", email: "user@example.com" };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(violationCodes, "getViolationCode").mockResolvedValue("1-1-1");
});

describe("draftEmail", () => {
  it("returns parsed email when response is valid", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValueOnce({
      choices: [
        { message: { content: JSON.stringify({ subject: "s", body: "b" }) } },
      ],
    } as unknown as ChatCompletion);

    const result = await draftEmail(
      baseCase,
      reportModules["oak-park"],
      sender,
    );
    expect(result).toEqual({
      subject: { en: "s" },
      body: { en: "b" },
    });
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

    const result = await draftEmail(
      baseCase,
      reportModules["oak-park"],
      sender,
    );
    expect(result).toEqual({
      subject: { en: "s2" },
      body: { en: "b2" },
    });
  });

  it("returns empty draft after repeated failures", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" } }],
    } as unknown as ChatCompletion);

    const result = await draftEmail(
      baseCase,
      reportModules["oak-park"],
      sender,
    );
    expect(result).toEqual({
      subject: { en: "" },
      body: { en: "" },
    });
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
    expect(result).toEqual({
      subject: { en: "s" },
      body: { en: "b" },
    });
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
    expect(result).toEqual({
      subject: { en: "s2" },
      body: { en: "b2" },
    });
  });

  it("returns empty draft after repeated failures", async () => {
    const { client } = getLlm("draft_email");
    vi.spyOn(client.chat.completions, "create").mockResolvedValue({
      choices: [{ message: { content: "{}" } }],
    } as unknown as ChatCompletion);

    const result = await draftOwnerNotification(baseCase, [
      "Oak Park Police Department",
    ]);
    expect(result).toEqual({
      subject: { en: "" },
      body: { en: "" },
    });
  });
});
