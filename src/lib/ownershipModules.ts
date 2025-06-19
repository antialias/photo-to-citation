import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import type { MailingAddress } from "./snailMail";
import { sendSnailMail as providerSendSnailMail } from "./snailMail";
import { config } from "./config";

export interface OwnershipRequestInfo {
  plate: string;
  state: string;
  vin?: string | null;
  ownerName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export interface OwnershipModule {
  id: string;
  state: string;
  address: string;
  fee: number;
  requiresCheck: boolean;
  requestVin?: (info: OwnershipRequestInfo) => Promise<void>;
  requestContactInfo?: (info: OwnershipRequestInfo) => Promise<void>;
}

function parseAddress(text: string): MailingAddress {
  const lines = text.trim().split(/\n+/);
  let name: string | undefined;
  if (lines.length > 3) name = lines.shift();
  const address1 = lines.shift() || "";
  const possibleCity = lines.pop() || "";
  const address2 = lines.length > 0 ? lines.shift() : undefined;
  const m = possibleCity.match(/^(.*),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  const city = m ? m[1] : "";
  const state = m ? m[2] : "";
  const postalCode = m ? m[3] : "";
  return { name, address1, address2, city, state, postalCode };
}

async function mailPdf(address: string, pdfPath: string): Promise<void> {
  const provider = config.SNAIL_MAIL_PROVIDER || "mock";
  const returnAddr = config.RETURN_ADDRESS;
  if (!returnAddr) throw new Error("RETURN_ADDRESS not configured");
  const to = parseAddress(address);
  const from = parseAddress(returnAddr);
  const result = await providerSendSnailMail(provider, {
    to,
    from,
    contents: pdfPath,
  });
  if (result.status === "shortfall") {
    throw new Error(
      `Unable to send mail: provider shortfall of ${result.shortfall}`,
    );
  }
  if (result.status !== "queued" && result.status !== "saved") {
    throw new Error(`Unable to send mail: provider error ${result.status}`);
  }
}

export async function fillIlForm(info: OwnershipRequestInfo): Promise<string> {
  const formPath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "forms",
    "il",
    "vsd375.pdf",
  );
  const bytes = fs.readFileSync(formPath);
  const pdf = await PDFDocument.load(new Uint8Array(bytes));
  const form = pdf.getForm();
  const set = (name: string, value: string | undefined) => {
    try {
      form.getTextField(name).setText(value ?? "");
    } catch {}
  };
  set("1", info.plate);
  set("2", info.state);
  set("3", info.vin ?? "");
  set("4", info.ownerName ?? "");
  set("5", info.address1 ?? "");
  set("6", info.address2 ?? "");
  set("7", info.city ?? "");
  set("8", info.postalCode ?? "");
  const outDir = path.join(process.cwd(), "data", "ownership_tmp");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${crypto.randomUUID()}.pdf`);
  fs.writeFileSync(outPath, await pdf.save());
  return outPath;
}

export const ownershipModules: Record<string, OwnershipModule> = {
  il: {
    id: "il",
    state: "Illinois",
    address:
      "Driver Records Unit\n2701 S. Dirksen Pkwy.\nSpringfield, IL 62723",
    fee: 12,
    requiresCheck: true,
    async requestVin(info) {
      const pdfPath = await fillIlForm(info);
      await mailPdf(this.address, pdfPath);
    },
    async requestContactInfo(info) {
      const pdfPath = await fillIlForm(info);
      await mailPdf(this.address, pdfPath);
    },
  },
  ca: {
    id: "ca",
    state: "California",
    address:
      "DMV Vehicle History Section\nP.O. Box 944247\nSacramento, CA 94244-2470",
    fee: 5,
    requiresCheck: true,
  },
};
