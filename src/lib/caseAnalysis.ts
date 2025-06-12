import fs from "node:fs";
import path from "node:path";
import { APIError } from "openai/error";
import { type Case, getCase, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { AnalysisError, analyzeViolation } from "./openai";
import { fetchCaseVinInBackground } from "./vinLookup";

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
    updateCase(caseData.id, {
      analysis: result,
      analysisStatus: "complete",
      analysisStatusCode: 200,
      analysisError: null,
    });
    const updated = getCase(caseData.id);
    if (updated) fetchCaseVinInBackground(updated);
  } catch (err) {
    if (err instanceof AnalysisError) {
      updateCase(caseData.id, {
        analysisStatusCode: 400,
        analysisError: err.kind,
      });
    } else {
      const status = err instanceof APIError ? err.status : 500;
      updateCase(caseData.id, {
        analysisStatusCode: status,
        analysisError: null,
      });
    }
    console.error("Failed to analyze case", caseData.id, err);
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  runJob("analyzeCase", caseData);
}
