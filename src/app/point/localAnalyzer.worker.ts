import { analyzeViolationLocal, loadOnnxModel } from "@/lib/browserAnalysis";

let session: unknown = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, modelUrl, image } = e.data as {
    type: string;
    modelUrl?: string;
    image?: ImageData;
  };
  if (type === "load" && modelUrl) {
    session = await loadOnnxModel(modelUrl);
    self.postMessage({ type: "ready" });
  } else if (type === "analyze" && image && session) {
    const result = await analyzeViolationLocal([image], { onnx: session });
    self.postMessage({ type: "result", result });
  }
};
