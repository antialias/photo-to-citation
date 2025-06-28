import type { ViolationReport } from "./openai";

export interface BrowserAnalysisProgress {
  stage: "load" | "run";
  index: number;
  total: number;
}

interface OnnxRuntime {
  env?: { init?: () => Promise<void> };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown;
  InferenceSession: { create(path: string): Promise<unknown> };
}

interface Tfjs {
  setBackend(name: string): Promise<void> | void;
  ready(): Promise<void>;
  loadGraphModel(path: string): Promise<unknown>;
  browser: { fromPixels(img: ImageData): { expandDims(n: number): unknown } };
}

let ort: OnnxRuntime | undefined;
let tf: Tfjs | undefined;

export async function loadOnnxModel(url: string): Promise<unknown> {
  if (!ort) {
    ort = (await import("onnxruntime-web")) as OnnxRuntime;
    if (ort.env?.init) await ort.env.init();
  }
  return ort.InferenceSession.create(url);
}

export async function loadTfliteModel(url: string): Promise<unknown> {
  if (!tf) {
    tf = (await import("@tensorflow/tfjs")) as Tfjs;
    await import("@tensorflow/tfjs-backend-wasm");
    await tf.setBackend("wasm");
    await tf.ready();
  }
  return tf.loadGraphModel(url);
}

export async function analyzeViolationLocal(
  images: ImageData[],
  options: {
    onnx?: unknown;
    tflite?: unknown;
    progress?: (p: BrowserAnalysisProgress) => void;
  },
): Promise<ViolationReport> {
  if (images.length === 0) {
    throw new Error("images");
  }
  const results: Array<{ plate?: string; type?: string }> = [];
  let idx = 0;
  for (const img of images) {
    options.progress?.({ stage: "run", index: idx, total: images.length });
    if (options.onnx) {
      const arr = Float32Array.from(img.data, (v) => v / 255);
      const tensor = new (ort as OnnxRuntime).Tensor("float32", arr, [
        1,
        img.height,
        img.width,
        4,
      ]);
      const out = await (
        options.onnx as {
          run: (
            x: unknown,
          ) => Promise<{ result: { plate?: string; type?: string } }>;
        }
      ).run({ input: tensor });
      results.push(out.result);
    } else if (options.tflite) {
      const tensor = tf?.browser.fromPixels(img).expandDims(0);
      const out = (
        options.tflite as {
          predict: (t: unknown) => {
            data: () => Promise<{ plate?: string; type?: string }>;
          };
        }
      ).predict(tensor);
      results.push(await out.data());
    } else {
      const mean = img.data.reduce((a, b) => a + b, 0) / img.data.length;
      results.push({ plate: `DBG${Math.round(mean)}` });
    }
    idx++;
  }
  const best = results[0] ?? {};
  return {
    violationType: best.type ?? "unknown",
    details: { en: "" }, // local model provides minimal detail
    vehicle: {
      licensePlateNumber: best.plate,
    },
    images: {},
  } as ViolationReport;
}
