export interface SentMail {
  id: string;
  providerId: string;
  providerMessageId: string;
  to: import("./snailMail").MailingAddress;
  from: import("./snailMail").MailingAddress;
  subject?: string;
  contents: string;
  status: string;
  trackingId?: string;
  /** @zod.date */
  sentAt: string;
}

import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

const dataFile = config.SNAIL_MAIL_FILE
  ? path.resolve(config.SNAIL_MAIL_FILE)
  : path.join(process.cwd(), "data", "snailMail.json");

function loadMails(): SentMail[] {
  if (!fs.existsSync(dataFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8")) as SentMail[];
  } catch {
    return [];
  }
}

function saveMails(list: SentMail[]): void {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2));
}

export function addSentMail(mail: SentMail): SentMail {
  const list = loadMails();
  list.push(mail);
  saveMails(list);
  return mail;
}

export function updateSentMail(
  id: string,
  update: Partial<SentMail>,
): SentMail | undefined {
  const list = loadMails();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...update };
  saveMails(list);
  return list[idx];
}

export function getSentMail(id: string): SentMail | undefined {
  return loadMails().find((m) => m.id === id);
}

export function getSentMails(): SentMail[] {
  return loadMails();
}
