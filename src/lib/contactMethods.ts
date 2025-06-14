export interface OwnerContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import twilio from "twilio";

import {
  type MailingAddress,
  sendSnailMail as providerSendSnailMail,
} from "./snailMail";

dotenv.config();

function parseAddress(text: string): MailingAddress {
  const lines = text.trim().split(/\n+/);
  let name: string | undefined;
  if (lines.length > 3) {
    name = lines.shift();
  }
  const address1 = lines.shift() || "";
  const possibleCity = lines.pop() || "";
  const address2 = lines.length > 0 ? lines.shift() : undefined;
  const m = possibleCity.match(/^(.*),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  const city = m ? m[1] : "";
  const state = m ? m[2] : "";
  const postalCode = m ? m[3] : "";
  return { name, address1, address2, city, state, postalCode };
}

export async function sendSms(to: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Twilio SMS not configured");
  }
  const client = twilio(sid, token);
  await client.messages.create({
    to,
    from,
    body: message,
  });
}

export async function sendWhatsapp(to: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Twilio WhatsApp not configured");
  }
  const client = twilio(sid, token);
  await client.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${from}`,
    body: message,
  });
}

export async function makeRobocall(to: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Twilio voice not configured");
  }
  const client = twilio(sid, token);
  await client.calls.create({
    to,
    from,
    twiml: `<Response><Say>${message}</Say></Response>`,
  });
}

export async function sendSnailMail(options: {
  address: string;
  subject: string;
  body: string;
  attachments: string[];
}): Promise<void> {
  const provider = process.env.SNAIL_MAIL_PROVIDER || "mock";
  const returnAddr = process.env.RETURN_ADDRESS;
  if (!returnAddr) {
    throw new Error("RETURN_ADDRESS not configured");
  }
  const to = parseAddress(options.address);
  const from = parseAddress(returnAddr);
  const dir = path.join(process.cwd(), "data", "snailmail_tmp");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${crypto.randomUUID()}.pdf`);
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  let page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const fontSize = 12;
  let y = height - 50;
  const maxWidth = width - 100;
  const wrap = (text: string) => {
    const words = text.split(/\s+/);
    let cur = "";
    const result: string[] = [];
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(next, fontSize) > maxWidth && cur) {
        result.push(cur);
        cur = word;
      } else {
        cur = next;
      }
    }
    if (cur) result.push(cur);
    return result;
  };
  const lines = `${options.subject}\n\n${options.body}`
    .split(/\n/)
    .flatMap((l) => wrap(l));
  for (const line of lines) {
    if (y < 50) {
      page = pdf.addPage();
      y = height - 50;
    }
    page.drawText(line, { x: 50, y, size: fontSize, font });
    y -= fontSize * 1.2;
  }
  for (const att of options.attachments) {
    const abs = path.join(process.cwd(), "public", att.replace(/^\/+/, ""));
    if (!fs.existsSync(abs)) continue;
    const bytes = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    const image =
      ext === ".png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const ratio = Math.min(
      maxWidth / image.width,
      (height - 100) / image.height,
      1,
    );
    const dims = image.scale(ratio);
    page = pdf.addPage();
    page.drawImage(image, {
      x: 50 + (maxWidth - dims.width) / 2,
      y: height - 50 - dims.height,
      width: dims.width,
      height: dims.height,
    });
  }
  fs.writeFileSync(filePath, await pdf.save());
  await providerSendSnailMail(provider, {
    to,
    from,
    subject: options.subject,
    contents: filePath,
  });
}
