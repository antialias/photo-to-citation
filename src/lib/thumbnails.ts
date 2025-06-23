import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { runJob } from "./jobScheduler";

export const THUMB_SIZES = [64, 128, 256, 512];

export async function generateThumbnails(
  buffer: Buffer,
  filename: string,
): Promise<void> {
  const base = path.basename(filename);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "thumbs");
  try {
    await sharp(buffer).metadata();
  } catch (err) {
    console.warn("Skipping thumbnail generation for invalid image", err);
    return;
  }
  await Promise.all(
    THUMB_SIZES.map(async (size) => {
      const dir = path.join(uploadDir, String(size));
      fs.mkdirSync(dir, { recursive: true });
      await sharp(buffer)
        .resize(size, undefined, { fit: "inside" })
        .toFile(path.join(dir, base));
    }),
  );
}

export function getThumbnailUrl(url: string, size: number): string {
  const base = path.basename(url);
  return `/uploads/thumbs/${size}/${base}`;
}

export function generateThumbnailsInBackground(
  buffer: Buffer,
  filename: string,
): void {
  runJob("generateThumbnails", { buffer, filename });
}
