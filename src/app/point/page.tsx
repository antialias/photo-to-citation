"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Worker for lightweight browser analysis
const AnalyzerWorker = () =>
  typeof Worker === "undefined"
    ? null
    : new Worker(new URL("./localAnalyzer.worker.ts", import.meta.url), {
        type: "module",
      });
import useAddFilesToCase from "@/app/useAddFilesToCase";
import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";

export default function PointAndShootPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [analysisHint, setAnalysisHint] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const params = useSearchParams();
  const caseId = params.get("case") || null;
  const uploadExisting = useAddFilesToCase(caseId ?? "");
  const uploadNew = useNewCaseFromFiles();
  const uploadCase = caseId ? uploadExisting : uploadNew;

  useEffect(() => {
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera API not available. Use HTTPS and a compatible browser.",
        );
        return;
      }
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        setCameraError("Camera requires a secure connection (HTTPS).");
        return;
      }
      try {
        const constraints = {
          audio: false,
          video: { facingMode: "environment" },
        } as const;
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const v = videoRef.current;
        if (v) {
          v.setAttribute("autoplay", "");
          v.setAttribute("muted", "");
          v.setAttribute("playsinline", "");
          if ("srcObject" in v) {
            v.srcObject = stream;
          } else {
            // @ts-expect-error - fallback for older browsers
            v.src = URL.createObjectURL(stream);
          }
          v.onloadedmetadata = () => {
            v.play().catch(() => {});
          };
        }
      } catch (err) {
        console.error("Could not access camera", err);
        setCameraError("Unable to access camera. Please check permissions.");
      }
    }
    startCamera();

    const w = AnalyzerWorker();
    if (w) {
      workerRef.current = w;
      w.postMessage({ type: "load", modelUrl: "/models/demo.onnx" });
      w.onmessage = (e) => {
        if (e.data.type === "result") {
          const r = e.data.result as {
            vehicle?: { licensePlateNumber?: string };
            violationType?: string;
          };
          setAnalysisHint(
            r.vehicle?.licensePlateNumber ?? r.violationType ?? null,
          );
        }
      };
    }

    let handle = 0;
    handle = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !w) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (canvas.width === 0 || canvas.height === 0) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      w.postMessage({ type: "analyze", image: data }, [data.data.buffer]);
    }, 2000);

    const v = videoRef.current;
    return () => {
      if (v?.srcObject) {
        for (const t of (v.srcObject as MediaStream).getTracks()) {
          t.stop();
        }
      }
      if (w) w.terminate();
      clearInterval(handle);
    };
  }, []);

  async function takePicture() {
    if (!videoRef.current || !canvasRef.current) return;
    setUploading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      await uploadCase(dt.files);
    }, "image/jpeg");
  }

  async function handleInputChange(files: FileList | null) {
    setUploading(true);
    await uploadCase(files);
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black">
      {cameraError && (
        <div className="absolute inset-x-0 top-0 z-10 bg-red-600 text-white text-center py-2">
          {cameraError}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <track kind="captions" label="" />
      </video>
      <canvas ref={canvasRef} className="hidden" />
      {uploading ? (
        <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center pointer-events-none text-xl z-10">
          Uploading photo...
        </div>
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 p-4 pointer-events-none">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleInputChange(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="pointer-events-auto bg-white/80 text-black px-4 py-2 rounded disabled:opacity-50"
        >
          Upload Picture
        </button>
        <button
          type="button"
          onClick={takePicture}
          disabled={uploading}
          className="pointer-events-auto bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Take Picture
        </button>
        {!analysisHint && (
          <div
            className="pointer-events-none text-white text-sm text-center"
            data-testid="instructions"
          >
            Point your camera at the vehicle. We&apos;ll guess the plate or
            violation below.
          </div>
        )}
        {analysisHint && (
          <div
            className="pointer-events-none text-white text-sm"
            data-testid="hint"
          >
            {analysisHint}
          </div>
        )}
        <Link
          href={caseId ? `/cases/${caseId}` : "/cases"}
          className="pointer-events-auto text-xs text-white underline mt-2"
        >
          {caseId ? "Back to Case" : "Cases"}
        </Link>
      </div>
    </div>
  );
}
