export interface SentMail {
  id: string;
  providerId: string;
  providerMessageId: string;
  /** Optional case this mail relates to */
  caseId?: string;
  /** Optional user who initiated the mail */
  userId?: string;
  to: import("./snailMail").MailingAddress;
  from: import("./snailMail").MailingAddress;
  subject?: string;
  contents: string;
  status: string;
  trackingId?: string;
  /** @zod.date */
  sentAt: string;
}

import path from "node:path";
import { config } from "./config";
import { readJsonFile, writeJsonFile } from "./fileUtils";

const dataFile = config.SNAIL_MAIL_FILE
  ? path.resolve(config.SNAIL_MAIL_FILE)
  : path.join(process.cwd(), "data", "snailMail.json");

function loadMails(): SentMail[] {
  return readJsonFile<SentMail[]>(dataFile, []);
}

function saveMails(list: SentMail[]): void {
  writeJsonFile(dataFile, list);
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
