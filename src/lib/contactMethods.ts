export interface OwnerContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import { PDFDocument, StandardFonts } from "pdf-lib";
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
    console.warn("Twilio not configured");
    return;
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
    console.warn("Twilio not configured");
    return;
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
    console.warn("Twilio not configured");
    return;
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
    console.warn("RETURN_ADDRESS not configured");
    return;
  }
  const to = parseAddress(options.address);
  const from = parseAddress(returnAddr);
  const dir = path.join(process.cwd(), "data", "snailmail_tmp");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${crypto.randomUUID()}.pdf`);
  const pdf = await PDFDocument.create();
  let page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  const fontSize = 12;
  let y = height - 50;
  const lines = `${options.subject}\n\n${options.body}`.split(/\n/);
  for (const line of lines) {
    if (y < 50) {
      page = pdf.addPage();
      y = height - 50;
    }
    page.drawText(line, { x: 50, y, size: fontSize, font });
    y -= fontSize * 1.2;
  }
  fs.writeFileSync(filePath, await pdf.save());
  await providerSendSnailMail(provider, {
    to,
    from,
    subject: options.subject,
    contents: filePath,
  });
}
