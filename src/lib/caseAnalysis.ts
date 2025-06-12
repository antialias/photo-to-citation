import fs from "node:fs";
import path from "node:path";
import { APIError } from "openai/error";
import { type Case, getCase, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { analyzeViolation, ocrPaperwork } from "./openai";
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
    const imageMap: Record<string, string> = Object.fromEntries(
      images.map((i) => [i.filename, i.url]),
    );
    const result = await analyzeViolation(images);
    if (result.images) {
      for (const [name, info] of Object.entries(result.images)) {
        if (info.paperwork && !info.paperworkText) {
          const url = imageMap[name];
          if (url) info.paperworkText = await ocrPaperwork({ url });
        }
      }
    }
    updateCase(caseData.id, {
      analysis: result,
      analysisStatus: "complete",
      analysisStatusCode: 200,
    });
    const updated = getCase(caseData.id);
    if (updated) fetchCaseVinInBackground(updated);
  } catch (err) {
    const status = err instanceof APIError ? err.status : 500;
    updateCase(caseData.id, { analysisStatusCode: status });
    console.error("Failed to analyze case", caseData.id, err);
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  runJob("analyzeCase", caseData);
}
