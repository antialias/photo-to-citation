import fs from "node:fs";
import path from "node:path";
import { APIError } from "openai/error";
import { type Case, getCase, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { AnalysisError, analyzeViolation, ocrPaperwork } from "./openai";
import type { LlmProgress } from "./openai";
import { fetchCaseVinInBackground } from "./vinLookup";

export async function analyzeCase(
  caseData: Case,
  progress?: (update: LlmProgress) => void,
): Promise<void> {
  try {
    const images = caseData.photos.map((p, idx) => {
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
      progress?.({
        type: "upload",
        current: idx + 1,
        total: caseData.photos.length,
      });
      return {
        filename: path.basename(p),
        url: `data:${mime};base64,${buffer.toString("base64")}`,
      };
    });
    const imageMap: Record<string, string> = Object.fromEntries(
      images.map((i) => [i.filename, i.url]),
    );
    const result = await analyzeViolation(images, progress);
    if (result.images) {
      for (const [name, info] of Object.entries(result.images)) {
        if (info.paperwork && !info.paperworkText) {
          const url = imageMap[name];
          if (url) {
            const ocr = await ocrPaperwork({ url }, progress);
            info.paperworkText = ocr.text;
            if (ocr.info) info.paperworkInfo = ocr.info;
          }
        }
      }
    }
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
