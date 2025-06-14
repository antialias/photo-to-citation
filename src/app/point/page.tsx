"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useNewCaseFromFiles from "../useNewCaseFromFiles";

export default function PointAndShootPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const uploadCase = useNewCaseFromFiles();

  useEffect(() => {
    async function startCamera() {
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
            // @ts-ignore - fallback for older browsers
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
    return () => {
      if (videoRef.current?.srcObject) {
        for (const t of (
          videoRef.current.srcObject as MediaStream
        ).getTracks()) {
          t.stop();
        }
      }
    };
  }, []);

  async function takePicture() {
    if (!videoRef.current || !canvasRef.current) return;
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
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 p-4 pointer-events-none">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => uploadCase(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="pointer-events-auto bg-white/80 text-black px-4 py-2 rounded"
        >
          Upload Picture
        </button>
        <button
          type="button"
          onClick={takePicture}
          className="pointer-events-auto bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Take Picture
        </button>
        <Link
          href="/cases"
          className="pointer-events-auto text-xs text-white underline mt-2"
        >
          Cases
        </Link>
      </div>
    </div>
  );
}
