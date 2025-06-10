import fs from "node:fs";
import path from "node:path";
import { type Case, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { analyzeViolation } from "./openai";

export async function analyzeCase(caseData: Case): Promise<void> {
  try {
    const dataUrls = caseData.photos.map((p) => {
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
      return `data:${mime};base64,${buffer.toString("base64")}`;
    });
    const result = await analyzeViolation(dataUrls);
    updateCase(caseData.id, {
      analysis: result,
      representativeImageIndex: result.representativeImageIndex ?? 0,
    });
  } catch (err) {
    console.error("Failed to analyze case", caseData.id, err);
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  runJob("analyzeCase", caseData);
}
