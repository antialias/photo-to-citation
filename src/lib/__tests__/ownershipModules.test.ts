import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";

describe("ownershipModules.il.requestVin", () => {
  it("generates a PDF and mails it", async () => {
    process.env.RETURN_ADDRESS = "1 A St\nCity, IL 12345";
    process.env.SNAIL_MAIL_PROVIDER = "mock";
    vi.resetModules();
    const snailMail = await import("@/lib/snailMail");
    const { ownershipModules } = await import("@/lib/ownershipModules");
    const sendMock = vi
      .spyOn(snailMail, "sendSnailMail")
      .mockResolvedValue({ id: "1", status: "saved" });

    await ownershipModules.il.requestVin?.({
      plate: "ABC123",
      state: "IL",
      vin: "1HGCM82633A004352",
      vehicleMake: "Honda",
      vehicleYear: "2003",
    });

    expect(sendMock).toHaveBeenCalled();
    const opts = sendMock.mock.calls[0][1];
    expect(fs.existsSync(opts.contents)).toBe(true);
    const { PDFDocument } = await import("pdf-lib");
    const pdfBytes = fs.readFileSync(opts.contents);
    const pdf = await PDFDocument.load(new Uint8Array(pdfBytes));
    const form = pdf.getForm();
    expect(form.getTextField("16").getText()).toBe("ABC123");
    expect(form.getTextField("13").getText()).toBe("1HGCM82633A004352");
    expect(form.getTextField("12").getText()).toBe("Honda");
    expect(form.getTextField("11").getText()).toBe("2003");
  });
});
