import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { config } from "./config";

export interface CheckOptions {
  payee: string;
  amount: number | string;
  memo?: string;
  checkNumber: string | null | undefined;
}

export async function createCheckPdf(opts: CheckOptions): Promise<string> {
  const account = config.CHECK_ACCOUNT_NUMBER;
  const routing = config.CHECK_ROUTING_NUMBER;
  if (!account || !routing) {
    throw new Error(
      "CHECK_ACCOUNT_NUMBER or CHECK_ROUTING_NUMBER not configured",
    );
  }
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  page.drawText(`Check No. ${opts.checkNumber ?? ""}`, {
    x: 450,
    y: 750,
    size: fontSize,
    font,
  });
  page.drawText(`Date: ${new Date().toLocaleDateString("en-US")}`, {
    x: 50,
    y: 750,
    size: fontSize,
    font,
  });
  page.drawText(`Pay to the Order of: ${opts.payee}`, {
    x: 50,
    y: 720,
    size: fontSize,
    font,
  });
  page.drawText(`$${opts.amount}`, { x: 450, y: 720, size: fontSize, font });
  if (opts.memo) {
    page.drawText(`Memo: ${opts.memo}`, {
      x: 50,
      y: 690,
      size: fontSize,
      font,
    });
  }
  page.drawText(`${routing} ${account} ${opts.checkNumber ?? ""}`, {
    x: 50,
    y: 660,
    size: fontSize,
    font,
  });
  const dir = path.join(process.cwd(), "data", "checks_tmp");
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${crypto.randomUUID()}.pdf`);
  fs.writeFileSync(outPath, await pdf.save());
  return outPath;
}
