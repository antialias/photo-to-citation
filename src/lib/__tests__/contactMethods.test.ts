import { makeRobocall, sendSms, sendWhatsapp } from "@/lib/contactMethods";
import { describe, expect, it, vi } from "vitest";

const callCreateMock = vi.fn();
const messageCreateMock = vi.fn();
vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    calls: { create: callCreateMock },
    messages: { create: messageCreateMock },
  })),
}));

describe("makeRobocall", () => {
  it("calls Twilio when configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "sid";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    callCreateMock.mockResolvedValue({});

    await makeRobocall("+15557654321", "hello");

    expect(callCreateMock).toHaveBeenCalledWith({
      to: "+15557654321",
      from: "+15551234567",
      twiml: "<Response><Say>hello</Say></Response>",
    });
  });

  it("fails when Twilio is not configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "";
    process.env.TWILIO_AUTH_TOKEN = "";
    process.env.TWILIO_FROM_NUMBER = "";
    callCreateMock.mockClear();
    await expect(makeRobocall("+15557654321", "hello")).rejects.toThrow();
    expect(callCreateMock).not.toHaveBeenCalled();
  });
});

describe("sendSms", () => {
  it("calls Twilio when configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "sid";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    messageCreateMock.mockResolvedValue({});

    await sendSms("+15557654321", "hello");

    expect(messageCreateMock).toHaveBeenCalledWith({
      to: "+15557654321",
      from: "+15551234567",
      body: "hello",
    });
  });

  it("fails when Twilio is not configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "";
    process.env.TWILIO_AUTH_TOKEN = "";
    process.env.TWILIO_FROM_NUMBER = "";
    messageCreateMock.mockClear();
    await expect(sendSms("+15557654321", "hello")).rejects.toThrow();
    expect(messageCreateMock).not.toHaveBeenCalled();
  });
});

describe("sendWhatsapp", () => {
  it("calls Twilio when configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "sid";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    messageCreateMock.mockResolvedValue({});

    await sendWhatsapp("+15557654321", "hello");

    expect(messageCreateMock).toHaveBeenCalledWith({
      to: "whatsapp:+15557654321",
      from: "whatsapp:+15551234567",
      body: "hello",
    });
  });

  it("fails when Twilio is not configured", async () => {
    process.env.TWILIO_ACCOUNT_SID = "";
    process.env.TWILIO_AUTH_TOKEN = "";
    process.env.TWILIO_FROM_NUMBER = "";
    messageCreateMock.mockClear();
    await expect(sendWhatsapp("+15557654321", "hello")).rejects.toThrow();
    expect(messageCreateMock).not.toHaveBeenCalled();
  });
});
