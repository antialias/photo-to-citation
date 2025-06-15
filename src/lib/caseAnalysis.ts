import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Worker } from "node:worker_threads";
import { APIError } from "openai/error";
import { clearQueue, enqueueTask, removeQueuedPhoto } from "./analysisQueue";
import { type Case, getCase, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { AnalysisError, analyzeViolation, ocrPaperwork } from "./openai";
import { fetchCaseVinInBackground } from "./vinLookup";

const activeWorkers = new Map<string, Worker>();
const activePhotoAnalyses = new Map<string, AbortController>();

export function isPhotoAnalysisActive(id: string, photo: string): boolean {
  return activePhotoAnalyses.has(`${id}:${photo}`);
}

export function isCaseAnalysisActive(id: string): boolean {
  return activeWorkers.has(id);
}

export function cancelCaseAnalysis(id: string): boolean {
  const worker = activeWorkers.get(id);
  if (worker) {
    worker.terminate();
    activeWorkers.delete(id);
  }
  clearQueue(id);
  if (!worker) {
    return false;
  }
  updateCase(id, { analysisStatus: "canceled", analysisProgress: null });
  return true;
}

export function cancelPhotoAnalysis(id: string, photo: string): boolean {
  const key = `${id}:${photo}`;
  const ctrl = activePhotoAnalyses.get(key);
  if (!ctrl) return false;
  ctrl.abort();
  activePhotoAnalyses.delete(key);
  return true;
}

export function trackPhotoAnalysis(
  id: string,
  photo: string,
  ctrl: AbortController,
): void {
  activePhotoAnalyses.set(`${id}:${photo}`, ctrl);
}

export async function analyzeCase(caseData: Case): Promise<void> {
  try {
    const missing: string[] = [];
    const images = caseData.photos
      .map((p) => {
        const filePath = path.join(
          process.cwd(),
          "public",
          p.replace(/^\/+/, ""),
        );
        if (!fs.existsSync(filePath)) {
          missing.push(p);
          return null;
        }
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
      })
      .filter(Boolean) as Array<{ filename: string; url: string }>;
    if (missing.length > 0) {
      updateCase(caseData.id, {
        analysisStatus: "failed",
        analysisStatusCode: 404,
        analysisError: "images",
        analysisProgress: null,
      });
      console.error("Missing image files", caseData.id, missing);
      return;
    }
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
        analysisStatus: "failed",
        analysisStatusCode: 400,
        analysisError: err.kind,
        analysisProgress: null,
      });
    } else {
      const status = err instanceof APIError ? err.status : 500;
      updateCase(caseData.id, {
        analysisStatus: "failed",
        analysisStatusCode: status,
        analysisError: null,
        analysisProgress: null,
      });
    }
    console.error("Failed to analyze case", caseData.id, err);
  }
}

export function analyzeCaseInBackground(caseData: Case): void {
  enqueueTask(caseData.id, {
    async run() {
      if (activeWorkers.has(caseData.id)) return;
      const worker = runJob("analyzeCase", caseData);
      activeWorkers.set(caseData.id, worker);
      const cleanup = () => {
        activeWorkers.delete(caseData.id);
      };
      worker.on("exit", cleanup);
      worker.on("error", (err) => {
        console.error("analyzeCase worker failed", err);
        updateCase(caseData.id, {
          analysisStatus: "failed",
          analysisProgress: null,
        });
        cleanup();
      });
    },
  });
}

export async function reanalyzePhoto(
  caseData: Case,
  photo: string,
): Promise<void> {
  const filePath = path.join(
    process.cwd(),
    "public",
    photo.replace(/^\/+/, ""),
  );
  if (!fs.existsSync(filePath)) {
    updateCase(caseData.id, {
      analysisStatus: "failed",
      analysisProgress: null,
    });
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  updateCase(caseData.id, {
    analysisStatus: "pending",
    analysisProgress: { stage: "upload", index: 0, total: 1 },
  });
  const ctrl = new AbortController();
  trackPhotoAnalysis(caseData.id, photo, ctrl);
  try {
    const result = await analyzeViolation(
      [{ filename: path.basename(photo), url: dataUrl }],
      (p) => {
        updateCase(caseData.id, {
          analysisProgress: { ...p, step: 1, steps: 1 },
        });
      },
      ctrl.signal,
    );
    updateCase(caseData.id, { analysisProgress: null });
    const info = result.images?.[path.basename(photo)];
    if (info?.paperwork && !info.paperworkText) {
      const ocr = await ocrPaperwork(
        { url: dataUrl },
        (p) => {
          updateCase(caseData.id, {
            analysisProgress: { ...p, step: 2, steps: 2 },
          });
        },
        ctrl.signal,
      );
      updateCase(caseData.id, { analysisProgress: null });
      info.paperworkText = ocr.text;
      if (ocr.info) info.paperworkInfo = ocr.info;
    }
    const base = caseData.analysis ?? { vehicle: {}, images: {} };
    const merged = {
      ...base,
      vehicle: { ...base.vehicle },
      images: { ...base.images },
    } as typeof base;
    merged.images[path.basename(photo)] = info ?? { representationScore: 0 };
    const updates: Record<string, unknown> = {
      analysis: merged,
      analysisStatus: "complete",
      analysisError: null,
      analysisStatusCode: 200,
    };
    const updated = updateCase(caseData.id, updates);
    if (updated) fetchCaseVinInBackground(updated);
  } catch (err) {
    if (err instanceof AnalysisError) {
      updateCase(caseData.id, {
        analysisStatus: "failed",
        analysisStatusCode: 400,
        analysisError: err.kind,
        analysisProgress: null,
      });
    } else {
      const status = err instanceof APIError ? err.status : 500;
      updateCase(caseData.id, {
        analysisStatus: "failed",
        analysisStatusCode: status,
        analysisError: null,
        analysisProgress: null,
      });
    }
    console.error("Failed to analyze photo", caseData.id, photo, err);
  } finally {
    cancelPhotoAnalysis(caseData.id, photo);
  }
}

export function analyzePhotoInBackground(caseData: Case, photo: string): void {
  enqueueTask(caseData.id, {
    photo,
    async run() {
      const worker = runJob("analyzePhoto", { caseData, photo });
      activeWorkers.set(caseData.id, worker);
      const cleanup = () => {
        activeWorkers.delete(caseData.id);
      };
      worker.on("exit", cleanup);
      worker.on("error", (err) => {
        console.error("analyzePhoto worker failed", err);
        updateCase(caseData.id, {
          analysisStatus: "failed",
          analysisProgress: null,
        });
        cleanup();
      });
    },
  });
}

export function removePhotoAnalysis(caseId: string, photo: string): void {
  cancelPhotoAnalysis(caseId, photo);
  removeQueuedPhoto(caseId, photo);
  const c = getCase(caseId);
  if (!c || !c.analysis?.images) return;
  const name = path.basename(photo);
  if (c.analysis.images[name]) {
    const analysis = { ...c.analysis };
    delete analysis.images[name];
    updateCase(caseId, { analysis });
  }
}
