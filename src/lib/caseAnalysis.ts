import fs from "node:fs";
import path from "node:path";
import { type Case, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { analyzeViolation } from "./openai";

export async function analyzeCase(caseData: Case): Promise<void> {
  try {
    const images = caseData.photos.map((p) => {
      const filePath = path.join(
        process.cwd(),
        "public",
        p.replace(/^\/+/, ""),
      );
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
      const url = `data:${mime};base64,${buffer.toString("base64")}`;
      return { id: p, url };
    });
    const result = await analyzeViolation(images);
    updateCase(caseData.id, {
      analysis: result,
      representativeImage: result.representativeImage ?? caseData.photos[0],
    });
  } catch (err) {
    console.error("Failed to analyze case", caseData.id, err);
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  runJob("analyzeCase", caseData);
}
