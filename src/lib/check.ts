import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { config } from "./config";

export interface CheckOptions {
  payee: string;
  amount: number;
  checkNumber?: string | null;
  memo?: string | null;
  date?: string | null;
}

export async function createCheckPdf(options: CheckOptions): Promise<string> {
  const account = config.CHECK_ACCOUNT_NUMBER;
  const routing = config.CHECK_ROUTING_NUMBER;
  if (!account || !routing) {
    throw new Error("Check account not configured");
  }
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  let y = 742;
  const lines = [
    `Date: ${options.date ?? new Date().toLocaleDateString("en-US")}`,
    `Check Number: ${options.checkNumber ?? ""}`,
    `Pay to the Order Of: ${options.payee}`,
    `Amount: $${options.amount.toFixed(2)}`,
    `Memo: ${options.memo ?? ""}`,
    `Routing Number: ${routing}`,
    `Account Number: ${account}`,
  ];
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: fontSize, font });
    y -= fontSize * 1.5;
  }
  const outDir = path.join(process.cwd(), "data", "checks");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${crypto.randomUUID()}.pdf`);
  fs.writeFileSync(outPath, await pdf.save());
  return outPath;
}
