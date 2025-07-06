import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { config } from "./config";

export interface CheckOptions {
  payee: string;
  amount: string;
  checkNumber: string;
  memo?: string;
}

export async function createCheckPdf(options: CheckOptions): Promise<string> {
  const routing = config.CHECK_ROUTING_NUMBER;
  const account = config.CHECK_ACCOUNT_NUMBER;
  if (!routing || !account) {
    throw new Error("Check routing/account not configured");
  }
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  let y = 742;
  const draw = (label: string, value: string) => {
    page.drawText(`${label}: ${value}`, { x: 50, y, size: fontSize, font });
    y -= fontSize * 1.5;
  };
  draw("Pay to the Order of", options.payee);
  draw("Amount", `$${options.amount}`);
  draw("Check #", options.checkNumber);
  draw("Routing #", routing);
  draw("Account #", account);
  if (options.memo) {
    draw("Memo", options.memo);
  }
  const outDir = path.join(process.cwd(), "data", "checks_tmp");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${crypto.randomUUID()}.pdf`);
  fs.writeFileSync(outPath, await pdf.save());
  return outPath;
}
