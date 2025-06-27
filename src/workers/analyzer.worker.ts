import * as ort from "onnxruntime-web";

let det: ort.InferenceSession;
let rec: ort.InferenceSession;
let cls: ort.InferenceSession;

self.onmessage = async (e: MessageEvent) => {
  switch (e.data.type) {
    case "load": {
      const f = (u: string) => fetch(u).then((r) => r.arrayBuffer());
      [det, rec, cls] = await Promise.all([
        ort.InferenceSession.create(await f("/models/plate-det.onnx")),
        ort.InferenceSession.create(await f("/models/plate-rec.onnx")),
        ort.InferenceSession.create(await f("/models/violation-cls.onnx")),
      ]);
      console.debug("analyzer loaded");
      self.postMessage({ type: "loaded" });
      self.postMessage({ type: "debug", stage: "loaded" });
      break;
    }
    case "analyze": {
      const img: ImageData = e.data.image;
      const detIn = preprocess(img);
      self.postMessage({
        type: "debug",
        stage: "preprocess",
        dims: detIn.dims,
      });
      const detOut = (await det.run({ input: detIn })) as Record<
        string,
        ort.Tensor
      >;
      const boxes = detOut[Object.keys(detOut)[0]].data as Float32Array;
      const box = Array.from(boxes).slice(0, 4);
      console.debug("detector", box);
      self.postMessage({ type: "debug", stage: "detector", box });
      const plateImg = cropAndResize(img, box);
      self.postMessage({ type: "debug", stage: "crop", box, image: plateImg }, [
        plateImg.data.buffer,
      ]);
      const recIn = preprocess(plateImg, 32, 168);
      const recOut = (await rec.run({ input: recIn })) as Record<
        string,
        ort.Tensor
      >;
      const plateStr = decodePlate(
        recOut[Object.keys(recOut)[0]].data as Float32Array,
      );
      console.debug("plate", plateStr);
      self.postMessage({ type: "debug", stage: "plate", plate: plateStr });
      const clsIn = preprocess(img, 224, 224);
      const clsOut = (await cls.run({ input: clsIn })) as Record<
        string,
        ort.Tensor
      >;
      const violType = decodeViolation(
        clsOut[Object.keys(clsOut)[0]].data as Float32Array,
      );
      console.debug("class", violType);
      self.postMessage({ type: "debug", stage: "class", violType });
      self.postMessage({
        type: "result",
        result: {
          plate: plateStr || undefined,
          type: violType !== "unknown" ? violType : undefined,
        },
      });
      break;
    }
  }
};

function preprocess(img: ImageData, h = 512, w = 512): ort.Tensor {
  const full = new OffscreenCanvas(img.width, img.height);
  const ctx = full.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.putImageData(img, 0, 0);
  const canvas = new OffscreenCanvas(w, h);
  const c = canvas.getContext("2d");
  if (!c) throw new Error("canvas");
  c.drawImage(full, 0, 0, w, h);
  const { data } = c.getImageData(0, 0, w, h);
  const out = new Float32Array(3 * h * w);
  for (let i = 0; i < h * w; i++) {
    out[i] = data[i * 4] / 255;
    out[h * w + i] = data[i * 4 + 1] / 255;
    out[2 * h * w + i] = data[i * 4 + 2] / 255;
  }
  return new ort.Tensor("float32", out, [1, 3, h, w]);
}

function cropAndResize(img: ImageData, box: number[]): ImageData {
  const [x1, y1, x2, y2] = box.map((n) => Math.round(n));
  const w = x2 - x1;
  const h = y2 - y1;
  const full = new OffscreenCanvas(img.width, img.height);
  const ctx = full.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.putImageData(img, 0, 0);
  const c = new OffscreenCanvas(w, h);
  const cc = c.getContext("2d");
  cc?.drawImage(full, x1, y1, w, h, 0, 0, w, h);
  return cc?.getImageData(0, 0, w, h) ?? new ImageData(w, h);
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function decodePlate(logits: Float32Array): string {
  const classes = alphabet.length + 1;
  const steps = logits.length / classes;
  let res = "";
  let prev = -1;
  for (let t = 0; t < steps; t++) {
    let max = Number.NEGATIVE_INFINITY;
    let idx = -1;
    for (let i = 0; i < classes; i++) {
      const v = logits[t * classes + i];
      if (v > max) {
        max = v;
        idx = i;
      }
    }
    if (idx !== prev && idx < alphabet.length) res += alphabet[idx];
    prev = idx;
  }
  return res;
}

export function decodeViolation(logits: Float32Array): string {
  const labels = ["unknown", "bike-lane", "crosswalk", "double-park"];
  let max = logits[0];
  let idx = 0;
  for (let i = 1; i < logits.length; i++) {
    if (logits[i] > max) {
      max = logits[i];
      idx = i;
    }
  }
  return labels[idx] ?? "unknown";
}
