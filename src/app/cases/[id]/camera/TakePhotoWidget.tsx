"use client";
import useAddFilesToCase from "@/app/useAddFilesToCase";
import { useEffect, useRef, useState } from "react";

export default function TakePhotoWidget({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadCase = useAddFilesToCase(caseId);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API not available");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.setAttribute("autoplay", "");
          v.setAttribute("muted", "");
          v.setAttribute("playsinline", "");
          v.onloadedmetadata = () => {
            v.play().catch(() => {});
          };
        }
      } catch {
        setError("Unable to access camera");
      }
    }
    void startCamera();
    return () => {
      if (stream) {
        for (const t of stream.getTracks()) t.stop();
      }
    };
  }, []);

  async function takePicture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
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
      setUploading(true);
      await uploadCase(dt.files);
      setUploading(false);
      onClose();
    }, "image/jpeg");
  }

  return (
    <div className="bg-blue-600 text-white px-2 py-1 rounded mx-1 text-xs space-y-1 w-48">
      <video ref={videoRef} className="w-full h-32 bg-black rounded">
        <track kind="captions" label="" />
      </video>
      <canvas ref={canvasRef} className="hidden" />
      {error && <div className="text-red-200 text-center">{error}</div>}
      <div className="flex gap-1 justify-center">
        <button
          type="button"
          onClick={takePicture}
          disabled={uploading}
          className="bg-blue-800 text-white px-1 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Take Case Photo"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-black px-1 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
