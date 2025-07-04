import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { config } from "./config";
import { runJob } from "./jobScheduler";

export const THUMB_SIZES = [64, 128, 256, 512];

export async function generateThumbnails(
  buffer: Buffer,
  filename: string,
): Promise<void> {
  const base = path.basename(filename);
  const ext = path.extname(base).toLowerCase();
  const uploadDir = path.join(config.UPLOAD_DIR, "thumbs");
  try {
    await sharp(buffer, ext === ".pdf" ? { page: 0 } : undefined).metadata();
  } catch (err) {
    console.warn("Skipping thumbnail generation for invalid image", err);
    return;
  }
  await Promise.all(
    THUMB_SIZES.map(async (size) => {
      const dir = path.join(uploadDir, String(size));
      fs.mkdirSync(dir, { recursive: true });
      const outBase = ext === ".pdf" ? base.replace(/\.pdf$/i, ".jpg") : base;
      const img = sharp(
        buffer,
        ext === ".pdf" ? { page: 0 } : undefined,
      ).resize(size, undefined, { fit: "inside" });
      if (ext === ".pdf") img.jpeg();
      await img.toFile(path.join(dir, outBase));
    }),
  );
}

export function getThumbnailUrl(url: string, size: number): string {
  const base = path.basename(url);
  if (base.toLowerCase().endsWith(".pdf")) {
    return `/uploads/thumbs/${size}/${base.replace(/\.pdf$/i, ".jpg")}`;
  }
  return `/uploads/thumbs/${size}/${base}`;
}

export function generateThumbnailsInBackground(
  buffer: Buffer,
  filename: string,
): void {
  runJob("generateThumbnails", { buffer, filename });
}
