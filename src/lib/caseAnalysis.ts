import fs from "node:fs";
import path from "node:path";
import { APIError } from "openai/error";
import { type Case, getCase, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { AnalysisError, analyzeViolation, ocrPaperwork } from "./openai";
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
    let steps = 1 + caseData.photos.length;
    const currentStep = 1;
    updateCase(caseData.id, {
      analysisProgress: {
        stage: "upload",
        index: 0,
        total: images.length,
        step: currentStep,
        steps,
      },
    });
    const result = await analyzeViolation(images, (p) => {
      updateCase(caseData.id, {
        analysisProgress: { ...p, step: currentStep, steps },
      });
    });
    updateCase(caseData.id, { analysisProgress: null });
    const paperwork: Array<[string, string]> = [];
    if (result.images) {
      for (const [name, info] of Object.entries(result.images)) {
        if (info.paperwork && !info.paperworkText) {
          const url = imageMap[name];
          if (url) {
            paperwork.push([name, url]);
          }
        }
      }
    }
    steps = 1 + paperwork.length;
    let stepIndex = 2;
    for (const [name, url] of paperwork) {
      const ocr = await ocrPaperwork({ url }, (p) => {
        updateCase(caseData.id, {
          analysisProgress: { ...p, step: stepIndex, steps },
        });
      });
      updateCase(caseData.id, { analysisProgress: null });
      const info = result.images?.[name];
      if (info) {
        info.paperworkText = ocr.text;
        if (ocr.info) info.paperworkInfo = ocr.info;
      }
      stepIndex++;
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
