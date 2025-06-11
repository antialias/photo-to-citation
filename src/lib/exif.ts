import ExifParser from "exif-parser";

export interface Gps {
  lat: number;
  lon: number;
}

export function extractGps(buffer: Buffer): Gps | null {
  try {
    const result = ExifParser.create(buffer).parse();
    const lat = result.tags.GPSLatitude as number | undefined;
    const lon = result.tags.GPSLongitude as number | undefined;
    if (typeof lat === "number" && typeof lon === "number") {
      return { lat, lon };
    }
  } catch {
    // ignore
  }
  return null;
}

export function extractTimestamp(buffer: Buffer): string | null {
  try {
    const result = ExifParser.create(buffer).parse();
    const ts =
      (result.tags.DateTimeOriginal as number | undefined) ||
      (result.tags.CreateDate as number | undefined) ||
      (result.tags.ModifyDate as number | undefined);
    if (typeof ts === "number") {
      return new Date(ts * 1000).toISOString();
    }
  } catch {
    // ignore
  }
  return null;
}
