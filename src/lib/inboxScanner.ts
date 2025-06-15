import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { analyzeCaseInBackground } from "./caseAnalysis";
import { fetchCaseLocationInBackground } from "./caseLocation";
import { addCasePhoto, createCase } from "./caseStore";
import { extractGps, extractTimestamp } from "./exif";

dotenv.config();

const stateFile = process.env.INBOX_STATE_FILE
  ? path.resolve(process.env.INBOX_STATE_FILE)
  : path.join(process.cwd(), "data", "inbox.json");

function loadState(): number {
  try {
    const val = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    return typeof val.lastUid === "number" ? val.lastUid : 0;
  } catch {
    return 0;
  }
}

function saveState(uid: number): void {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify({ lastUid: uid }, null, 2));
}

export async function scanInbox(): Promise<void> {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT ? Number(process.env.IMAP_PORT) : 993,
    secure: process.env.IMAP_TLS !== "false",
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
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
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        fs.mkdirSync(uploadDir, { recursive: true });
        const casePhotos: string[] = [];
        const photoTimes: Record<string, string | null> = {};
        const gpsList: Array<{ lat: number; lon: number } | null> = [];
        for (const att of images) {
          const ext = path.extname(att.filename || "jpg") || ".jpg";
          const filename = `${crypto.randomUUID()}${ext}`;
          const buffer = att.content as Buffer;
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          const gps = extractGps(buffer);
          const takenAt = extractTimestamp(buffer);
          gpsList.push(gps);
          casePhotos.push(`/uploads/${filename}`);
          photoTimes[`/uploads/${filename}`] = takenAt;
        }
        const firstGps = gpsList.find((g) => g) || null;
        const firstPhoto = casePhotos.shift();
        if (!firstPhoto) return;
        const takenAt = photoTimes[firstPhoto];
        const newCase = createCase(firstPhoto, firstGps, undefined, takenAt);
        for (let i = 0; i < casePhotos.length; i++) {
          const p = casePhotos[i];
          addCasePhoto(newCase.id, p, photoTimes[p], gpsList[i + 1] || null);
        }
        analyzeCaseInBackground(newCase);
        fetchCaseLocationInBackground(newCase);
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
