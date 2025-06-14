import fs from "node:fs";
import path from "node:path";
import { type Case, updateCase } from "./caseStore";
import { type Gps, extractGps } from "./exif";
import { intersectionLookup, reverseGeocode } from "./geocode";
import { runJob } from "./jobScheduler";

export async function fetchCaseLocation(caseData: Case): Promise<void> {
  if (!caseData.gps) return;
  try {
    const [address, intersection] = await Promise.all([
      reverseGeocode(caseData.gps),
      intersectionLookup(caseData.gps),
    ]);
    updateCase(caseData.id, { streetAddress: address, intersection });
  } catch (err) {
    console.error("Failed to fetch location data", err);
  }
}

export function fetchCaseLocationInBackground(caseData: Case): void {
  runJob("fetchCaseLocation", caseData);
}

export function computeBestGps(caseData: Case): Gps | null {
  const ranked = caseData.analysis?.images
    ? Object.entries(caseData.analysis.images)
        .sort((a, b) => b[1].representationScore - a[1].representationScore)
        .map(([n]) => n)
    : [];
  const ordered = ranked
    .map((n) => caseData.photos.find((p) => path.basename(p) === n))
    .filter((p): p is string => Boolean(p));
  const all = Array.from(new Set([...ordered, ...caseData.photos]));
  for (const p of all) {
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        p.replace(/^\/+/u, ""),
      );
      const buffer = fs.readFileSync(filePath);
      const gps = extractGps(buffer);
      if (gps) return gps;
    } catch {
      // ignore missing files
    }
  }
  return null;
}
