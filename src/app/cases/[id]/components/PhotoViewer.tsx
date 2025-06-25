"use client";
import EditableText from "@/app/components/EditableText";
import ImageHighlights from "@/app/components/ImageHighlights";
import useCloseOnOutsideClick from "@/app/useCloseOnOutsideClick";
import { Progress } from "@/components/ui/progress";
import type { Case } from "@/lib/caseStore";
import type { LlmProgress } from "@/lib/openai";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export default function PhotoViewer({
  caseData,
  selectedPhoto,
  progress,
  progressDescription,
  requestValue,
  isPhotoReanalysis,
  reanalyzingPhoto,
  analysisActive,
  readOnly,
  photoNote,
  updatePhotoNote,
  removePhoto,
  reanalyzePhoto,
}: {
  caseData: Case;
  selectedPhoto: string;
  progress: LlmProgress | null;
  progressDescription: string;
  requestValue: number | undefined;
  isPhotoReanalysis: boolean;
  reanalyzingPhoto: string | null;
  analysisActive: boolean;
  readOnly: boolean;
  photoNote: string;
  updatePhotoNote: (value: string) => Promise<void>;
  removePhoto: (photo: string) => Promise<void>;
  reanalyzePhoto: (
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) => Promise<void>;
}) {
  const photoMenuRef = useRef<HTMLDetailsElement>(null);
  useCloseOnOutsideClick(photoMenuRef);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDistance = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  const pointFromEvent = useCallback((e: PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const applyZoom = useCallback(
    (newScale: number, center: { x: number; y: number }) => {
      setScale((old) => {
        const s = Math.min(10, Math.max(1, newScale));
        setOffset((o) => ({
          x: center.x - ((center.x - o.x) * s) / old,
          y: center.y - ((center.y - o.y) * s) / old,
        }));
        return s;
      });
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.set(e.pointerId, pointFromEvent(e.nativeEvent));
      (e.target as Element).setPointerCapture(e.pointerId);
      lastPointer.current = pointFromEvent(e.nativeEvent);
    },
    [pointFromEvent],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, pointFromEvent(e.nativeEvent));
      const pts = Array.from(pointers.current.values());
      if (pts.length === 2) {
        const [p1, p2] = pts;
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        if (lastDistance.current !== null && lastCenter.current) {
          const prev = lastCenter.current;
          const ds = dist / lastDistance.current;
          applyZoom(scale * ds, center);
          setOffset((o) => ({
            x: o.x + (center.x - prev.x),
            y: o.y + (center.y - prev.y),
          }));
        }
        lastDistance.current = dist;
        lastCenter.current = center;
      } else if (pts.length === 1 && scale > 1) {
        const p = pts[0];
        if (lastPointer.current) {
          const prev = lastPointer.current;
          setOffset((o) => ({
            x: o.x + (p.x - prev.x),
            y: o.y + (p.y - prev.y),
          }));
        }
        lastPointer.current = p;
      }
    },
    [applyZoom, scale, pointFromEvent],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    lastDistance.current = null;
    lastCenter.current = null;
    lastPointer.current = null;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      const rect = e.currentTarget.getBoundingClientRect();
      const center = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      applyZoom(scale * factor, center);
    },
    [applyZoom, scale],
  );
  const t = caseData.photoTimes[selectedPhoto];
  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/2] md:max-w-2xl shrink-0 overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <Image
          src={selectedPhoto}
          alt="uploaded"
          fill
          className="object-contain"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        />
        {isPhotoReanalysis && reanalyzingPhoto === selectedPhoto ? (
          <div className="absolute top-0 left-0 right-0">
            <Progress
              value={requestValue}
              indeterminate={requestValue === undefined}
            />
          </div>
        ) : null}
        {readOnly ? null : (
          <details
            ref={photoMenuRef}
            className="absolute top-1 right-1 text-white"
            onToggle={() => {
              if (photoMenuRef.current?.open) {
                photoMenuRef.current
                  .querySelector<HTMLElement>("button, a")
                  ?.focus();
              }
            }}
          >
            <summary
              className="cursor-pointer select-none bg-black/40 rounded px-1 opacity-70"
              aria-label="Photo actions menu"
            >
              ⋮
            </summary>
            <div
              className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow text-black dark:text-white"
              role="menu"
            >
              <button
                type="button"
                onClick={(e) =>
                  reanalyzePhoto(
                    selectedPhoto,
                    e.currentTarget.closest("details"),
                  )
                }
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                disabled={
                  caseData.analysisStatus === "pending" && analysisActive
                }
              >
                Reanalyze Photo
              </button>
              <button
                type="button"
                onClick={() => removePhoto(selectedPhoto)}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                Delete Image
              </button>
            </div>
          </details>
        )}
        {caseData.analysis ? (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 space-y-1 text-sm">
            <ImageHighlights
              analysis={caseData.analysis}
              photo={selectedPhoto}
            />
            {progress ? <p>{progressDescription}</p> : null}
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
            {progressDescription}
          </div>
        )}
      </div>
      {t ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Taken {new Date(t).toLocaleString()}
        </p>
      ) : null}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Note:</span>{" "}
        {readOnly ? (
          <span>{photoNote || ""}</span>
        ) : (
          <EditableText
            value={photoNote}
            onSubmit={updatePhotoNote}
            onClear={photoNote ? () => updatePhotoNote("") : undefined}
            placeholder="Add note"
          />
        )}
      </p>
    </>
  );
}
