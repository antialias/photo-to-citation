import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { config } from "./config";
import type { MailingAddress } from "./snailMail";
import { sendSnailMail as providerSendSnailMail } from "./snailMail";

export interface OwnershipRequestInfo {
  plate: string;
  state: string;
  vin?: string | null;
  ownerName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  driversLicense?: string | null;
  requesterName?: string | null;
  requesterBusinessName?: string | null;
  requesterAddress?: string | null;
  requesterCityStateZip?: string | null;
  requesterDaytimePhoneNumber?: string | null;
  requesterDriverLicenseNumber?: string | null;
  requesterEmailAddress?: string | null;
  requesterPhoneNumber?: string | null;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  titleNumber?: string | null;
  plateYear?: string | null;
  reasonForRequestingRecords?: string | null;
  plateCategoryOther?: string | null;
  requesterPositionInOrginization?: string | null;
  requesterProfessionalLicenseOrARDCNumber?: string | null;
  // checkboxes
  titleSearch?: boolean;
  registrationSearch?: boolean;
  certifiedTitleSearch?: boolean;
  certifiedRegistrationSearch?: boolean;
  microfilmWithSearchOption?: boolean;
  microfilmOnly?: boolean;
  passenger?: boolean;
  bTruck?: boolean;
  plateCategoryOtherCheck?: boolean;
  reasonA?: boolean;
  reasonB?: boolean;
  reasonC?: boolean;
  reasonD?: boolean;
  reasonE?: boolean;
  reasonF?: boolean;
  reasonG?: boolean;
  reasonH?: boolean;
  reasonI?: boolean;
  reasonJ?: boolean;
  reasonK?: boolean;
  reasonL?: boolean;
  reasonM?: boolean;
  reasonN?: boolean;
  reasonO?: boolean;
}

export interface OwnershipModule {
  id: string;
  state: string;
  address: string;
  fee: number;
  requiresCheck: boolean;
  requestVin?: (info: OwnershipRequestInfo) => Promise<void>;
  requestContactInfo?: (info: OwnershipRequestInfo) => Promise<void>;
  /**
   * Generate one or more PDF forms required for this state's
   * ownership request process. The returned paths should be absolute
   * and will be appended to the outgoing snail‑mail request.
   */
  generateForms?: (info: OwnershipRequestInfo) => Promise<string | string[]>;
}

export const IL_FORM_FIELD_MAP: Record<string, string> = {
  driversLicense: "6",
  plate: "16",
  vin: "13",
  vehicleYear: "11",
  ownerName: "15",
  vehicleMake: "12",
  requesterName: "1",
  requesterAddress: "4",
  requesterBusinessName: "2",
  requesterCityStateZip: "3",
  requesterDaytimePhoneNumber: "5",
  requesterDriverLicenseNumber: "6",
  requesterEmailAddress: "7",
  requesterPhoneNumber: "9",
  titleNumber: "10",
  plateYear: "17",
  reasonForRequestingRecords: "19",
  plateCategoryOther: "14",
  requesterPositionInOrginization: "20",
  requesterProfessionalLicenseOrARDCNumber: "21",
};

export const IL_FORM_CHECKBOX_MAP: Record<string, string> = {
  titleSearch: "cb1",
  registrationSearch: "cb2",
  certifiedTitleSearch: "cb3",
  certifiedRegistrationSearch: "cb4",
  microfilmWithSearchOption: "cb5",
  passenger: "cb8",
  bTruck: "cb6",
  plateCategoryOtherCheck: "cb7",
  reasonA: "cb9",
  reasonB: "cb10",
  reasonC: "cb11",
  reasonD: "cb12",
  reasonE: "cb13",
  reasonF: "cb14",
  reasonG: "cb15",
  reasonH: "cb16",
  reasonI: "cb17",
  reasonJ: "cb18",
  reasonK: "cb19",
  reasonL: "cb20",
  reasonM: "cb21",
  reasonN: "cb22",
  reasonO: "cb23",
  microfilmOnly: "cb5a",
};

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
  const formPath = path.resolve(path.join("forms", "il", "vsd375.pdf"));
  const bytes = fs.readFileSync(formPath);
  const pdf = await PDFDocument.load(new Uint8Array(bytes));
  const form = pdf.getForm();
  const setField = (name: string, value: string | undefined) => {
    try {
      form.getTextField(name).setText(value ?? "");
    } catch {}
  };
  for (const [key, field] of Object.entries(IL_FORM_FIELD_MAP)) {
    const value = (info as unknown as Record<string, unknown>)[key];
    setField(field, value ? String(value) : "");
  }
  for (const [key, field] of Object.entries(IL_FORM_CHECKBOX_MAP)) {
    const val = (info as unknown as Record<string, unknown>)[key];
    try {
      const cb = form.getCheckBox(field);
      if (val) {
        cb.check();
      } else {
        cb.uncheck();
      }
    } catch {}
  }
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
    async generateForms(info) {
      const pdfPath = await fillIlForm(info);
      return pdfPath;
    },
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
