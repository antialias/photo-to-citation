import fs from "node:fs";
import path from "node:path";
import { APIError } from "openai/error";
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
      return {
        filename: path.basename(p),
        url: `data:${mime};base64,${buffer.toString("base64")}`,
      };
    });
    const result = await analyzeViolation(images);
    updateCase(caseData.id, { analysis: result, analysisStatusCode: 200 });
  } catch (err) {
    const status = err instanceof APIError ? err.status : 500;
    updateCase(caseData.id, { analysisStatusCode: status });
    console.error("Failed to analyze case", caseData.id, err);
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  runJob("analyzeCase", caseData);
}
