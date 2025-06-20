export interface LoggedEmail {
  to: string;
  subject: string;
  body: string;
  attachments: string[];
  /** @zod.date */
  sentAt: string;
}

import path from "node:path";
import { config } from "./config";
import { readJsonFile, writeJsonFile } from "./fileUtils";

const dataFile = config.EMAIL_FILE
  ? path.resolve(config.EMAIL_FILE)
  : path.join(process.cwd(), "data", "emails.json");

function loadEmails(): LoggedEmail[] {
  return readJsonFile<LoggedEmail[]>(dataFile, []);
}

function saveEmails(list: LoggedEmail[]): void {
  writeJsonFile(dataFile, list);
}

export function addSentEmail(email: LoggedEmail): LoggedEmail {
  const list = loadEmails();
  list.push(email);
  saveEmails(list);
  return email;
}

export function getSentEmails(): LoggedEmail[] {
  return loadEmails();
}

export function clearSentEmails(): void {
  saveEmails([]);
}
