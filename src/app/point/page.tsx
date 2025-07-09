"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

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
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const { t } = useTranslation();
  const params = useSearchParams();
  const caseId = params.get("case") || null;
  const addFiles = useAddFilesToCase(caseId ?? "");
  const newCase = useNewCaseFromFiles();
  const uploadCase = caseId ? addFiles : newCase;

  const styles = {
    root: css({
      position: "relative",
      height: "100dvh",
      overflow: "hidden",
      backgroundColor: "black",
    }),
    cameraError: css({
      position: "absolute",
      insetInlineStart: 0,
      insetInlineEnd: 0,
      top: 0,
      zIndex: "var(--z-nav)",
      backgroundColor: token("colors.red.600"),
      color: "white",
      textAlign: "center",
      py: "2",
    }),
    video: css({
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 0,
    }),
    canvas: css({ display: "none" }),
    uploading: css({
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      fontSize: "xl",
      zIndex: "var(--z-nav)",
    }),
    hintWrapper: css({
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      zIndex: "var(--z-nav)",
    }),
    hint: css({
      backgroundColor: "rgba(0,0,0,0.4)",
      color: "white",
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
      fontSize: "xl",
    }),
    controls: css({
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "2",
      p: "4",
      pointerEvents: "none",
    }),
    uploadButton: css({
      pointerEvents: "auto",
      backgroundColor: "rgba(255,255,255,0.8)",
      color: "black",
      px: "4",
      py: "2",
      borderRadius: token("radii.md"),
      _disabled: { opacity: 0.5 },
    }),
    takePictureButton: css({
      pointerEvents: "auto",
      backgroundColor: token("colors.blue.600"),
      color: "white",
      px: "4",
      py: "2",
      borderRadius: token("radii.md"),
      width: "100%",
      _disabled: { opacity: 0.5 },
    }),
    backLink: css({
      pointerEvents: "auto",
      fontSize: "xs",
      color: "white",
      textDecorationLine: "underline",
      mt: "2",
    }),
  } as const;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(t("cameraApiUnavailable"));
        return;
      }
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        setCameraError(t("cameraRequiresSecure"));
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
        setCameraError(t("cameraAccessError"));
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
  }, [t]);

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
      await uploadCase(dt.files, gps);
    }, "image/jpeg");
  }

  async function handleInputChange(files: FileList | null) {
    setUploading(true);
    await uploadCase(files);
  }

  return (
    <div className={styles.root}>
      {cameraError && <div className={styles.cameraError}>{cameraError}</div>}
      <video ref={videoRef} autoPlay muted playsInline className={styles.video}>
        <track kind="captions" label="" />
      </video>
      <canvas ref={canvasRef} className={styles.canvas} />
      {uploading ? (
        <div className={styles.uploading}>{t("uploadingPhoto")}</div>
      ) : null}
      <div className={styles.hintWrapper}>
        <div className={styles.hint} data-testid="hint">
          {analysisHint ?? t("nothingDetected")}
        </div>
      </div>
      <div className={styles.controls}>
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
          className={styles.uploadButton}
        >
          {t("uploadPicture")}
        </button>
        <button
          type="button"
          onClick={takePicture}
          disabled={uploading}
          className={styles.takePictureButton}
        >
          {t("takePicture")}
        </button>
        <Link
          href={caseId ? `/cases/${caseId}` : "/cases"}
          className={styles.backLink}
        >
          {caseId ? t("backToCase") : t("nav.cases")}
        </Link>
      </div>
    </div>
  );
}
