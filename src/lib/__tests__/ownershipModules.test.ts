import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ownershipModules } from "../ownershipModules";
import * as snailMail from "../snailMail";

describe("ownershipModules.il.requestVin", () => {
  it("generates a PDF and mails it", async () => {
    process.env.RETURN_ADDRESS = "1 A St\nCity, IL 12345";
    process.env.SNAIL_MAIL_PROVIDER = "mock";
    const sendMock = vi
      .spyOn(snailMail, "sendSnailMail")
      .mockResolvedValue({ id: "1", status: "saved" });

    await ownershipModules.il.requestVin({
      plate: "ABC123",
      state: "IL",
      vin: "1HGCM82633A004352",
    });

    expect(sendMock).toHaveBeenCalled();
    const opts = sendMock.mock.calls[0][1];
    expect(fs.existsSync(opts.contents)).toBe(true);
  });
});
