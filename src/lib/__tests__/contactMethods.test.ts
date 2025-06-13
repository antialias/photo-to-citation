import { describe, expect, it, vi } from "vitest";
import { makeRobocall } from "../contactMethods";

const createMock = vi.fn();
vi.mock("twilio", () => ({
  default: vi.fn(() => ({ calls: { create: createMock } })),
}));

describe("makeRobocall", () => {
  it("calls Twilio when configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "sid";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    createMock.mockResolvedValue({});

    await makeRobocall("+15557654321", "hello");

    expect(createMock).toHaveBeenCalledWith({
      to: "+15557654321",
      from: "+15551234567",
      twiml: "<Response><Say>hello</Say></Response>",
    });
  });

  it("skips when Twilio is not configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "";
    process.env.TWILIO_AUTH_TOKEN = "";
    process.env.TWILIO_FROM_NUMBER = "";
    createMock.mockClear();

    await makeRobocall("+15557654321", "hello");

    expect(createMock).not.toHaveBeenCalled();
  });
});
