import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { analyzeCaseInBackground } from "./caseAnalysis";
import { fetchCaseLocationInBackground } from "./caseLocation";
import { addCaseEmail, addCasePhoto, createCase, getCase } from "./caseStore";
import { config } from "./config";
import { sendEmail } from "./email";
import { extractGps, extractTimestamp } from "./exif";
import { readJsonFile, writeJsonFile } from "./fileUtils";
import { generateThumbnailsInBackground } from "./thumbnails";
import { getUserByEmail } from "./userStore";

const stateFile = config.INBOX_STATE_FILE
  ? path.resolve(config.INBOX_STATE_FILE)
  : path.join(process.cwd(), "data", "inbox.json");

function loadState(): number {
  const val = readJsonFile<{ lastUid?: number }>(stateFile, {});
  return typeof val.lastUid === "number" ? val.lastUid : 0;
}

function saveState(uid: number): void {
  writeJsonFile(stateFile, { lastUid: uid });
}

export async function scanInbox(): Promise<void> {
  const client = new ImapFlow({
    host: config.IMAP_HOST,
    port: config.IMAP_PORT ? Number(config.IMAP_PORT) : 993,
    secure: config.IMAP_TLS !== false,
    auth: {
      user: config.IMAP_USER,
      pass: config.IMAP_PASS,
    },
  });

  await client.connect();
  await client.mailboxOpen("INBOX");
  let lastUid = loadState();

  async function processNew(): Promise<void> {
    for await (const msg of client.fetch(`${lastUid + 1}:*`, {
      uid: true,
      source: true,
    })) {
      const parsed = await simpleParser(msg.source);
      const images = parsed.attachments.filter((a: { contentType: string }) =>
        a.contentType.startsWith("image/"),
      );
      if (images.length > 0) {
        const from = parsed.from?.value?.[0]?.address || null;
        const subject = parsed.subject || "";
        const tokenMatch = subject.match(/\[cid:([a-f0-9-]+)\]/i);
        let c = tokenMatch ? getCase(tokenMatch[1]) : undefined;
        const uploadDir = config.UPLOAD_DIR;
        fs.mkdirSync(uploadDir, { recursive: true });
        const casePhotos: string[] = [];
        const photoTimes: Record<string, string | null> = {};
        const gpsList: Array<{ lat: number; lon: number } | null> = [];
        for (const att of images) {
          const ext = path.extname(att.filename || "jpg") || ".jpg";
          const filename = `${crypto.randomUUID()}${ext}`;
          const buffer = att.content as Buffer;
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          generateThumbnailsInBackground(buffer, filename);
          const gps = extractGps(buffer);
          const takenAt = extractTimestamp(buffer);
          gpsList.push(gps);
          casePhotos.push(filename);
          photoTimes[filename] = takenAt;
        }
        if (c) {
          for (let i = 0; i < casePhotos.length; i++) {
            const p = casePhotos[i];
            addCasePhoto(c.id, p, photoTimes[p], gpsList[i] || null);
          }
        } else {
          const firstGps = gpsList.find((g) => g) || null;
          const firstPhoto = casePhotos.shift();
          if (!firstPhoto) return;
          const takenAt = photoTimes[firstPhoto];
          const ownerId = from ? (getUserByEmail(from)?.id ?? null) : null;
          c = createCase(firstPhoto, firstGps, undefined, takenAt, ownerId);
          for (let i = 0; i < casePhotos.length; i++) {
            const p = casePhotos[i];
            addCasePhoto(c.id, p, photoTimes[p], gpsList[i + 1] || null);
          }
          analyzeCaseInBackground(c, "en");
          fetchCaseLocationInBackground(c);
          if (from) {
            const baseUrl = config.NEXTAUTH_URL || "";
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
            const link = `${baseUrl}${basePath}/cases/${c.id}`;
            const receiptSubject = `Case receipt [cid:${c.id}]`;
            const body = `View your case at ${link}`;
            await sendEmail({ to: from, subject: receiptSubject, body });
            addCaseEmail(c.id, {
              to: from,
              subject: receiptSubject,
              body,
              attachments: [],
              sentAt: new Date().toISOString(),
              replyTo: null,
            });
          }
        }
      }
      if (msg.uid > lastUid) {
        lastUid = msg.uid;
        saveState(lastUid);
      }
    }
  }

  await processNew();
  client.on("exists", processNew);
  await client.idle();
}
