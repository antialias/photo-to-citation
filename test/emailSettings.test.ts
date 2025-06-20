// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createTransport = vi.fn();
vi.mock("nodemailer", () => ({ default: { createTransport } }));

let envBackup: NodeJS.ProcessEnv;

beforeEach(() => {
  envBackup = { ...process.env };
  vi.resetModules();
  createTransport.mockReset();
});

afterEach(() => {
  process.env = envBackup;
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("throws when SMTP variables are missing", async () => {
    process.env.SMTP_HOST = "";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASS = "";
    process.env.SMTP_FROM = "";
    const { sendEmail } = await import("@/lib/email");
    await expect(
      sendEmail({ to: "x@example.com", subject: "a", body: "b" }),
    ).rejects.toThrow(/SMTP/);
  });

  it("creates a transporter when variables exist", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    createTransport.mockReturnValue({ sendMail });
    process.env.SMTP_HOST = "localhost";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.SMTP_FROM = "from@example.com";
    const { sendEmail } = await import("@/lib/email");
    await sendEmail({ to: "x@example.com", subject: "a", body: "b" });
    expect(createTransport).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
  });
});
