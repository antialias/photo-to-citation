"use client";
import useAddFilesToCase from "@/app/useAddFilesToCase";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChatWidget, WidgetActions } from "../widgets";

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
  const { t } = useTranslation();

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t("cameraApiUnavailable"));
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
        setError(t("cameraAccessError"));
      }
    }
    void startCamera();
    return () => {
      if (stream) {
        for (const t of stream.getTracks()) t.stop();
      }
    };
  }, [t]);

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
    <ChatWidget className="w-48">
      <video ref={videoRef} className="w-full h-32 bg-black rounded">
        <track kind="captions" label="" />
      </video>
      <canvas ref={canvasRef} className="hidden" />
      {error && <div className="text-red-200 text-center">{error}</div>}
      <WidgetActions centered>
        <button
          type="button"
          onClick={takePicture}
          disabled={uploading}
          className="bg-blue-800 text-white px-1 rounded disabled:opacity-50"
        >
          {uploading ? t("uploading") : t("takePicture")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-black px-1 rounded"
        >
          {t("close")}
        </button>
      </WidgetActions>
    </ChatWidget>
  );
}
