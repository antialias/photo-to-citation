"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export function constrainPan(
  container: { width: number; height: number } | undefined,
  natural: { width: number; height: number } | undefined,
  t: Transform,
): Transform {
  if (!container || !natural) return t;
  const ratio = natural.width / natural.height;
  const containerRatio = container.width / container.height;
  let baseWidth: number;
  let baseHeight: number;
  if (ratio > containerRatio) {
    baseWidth = container.width;
    baseHeight = container.width / ratio;
  } else {
    baseHeight = container.height;
    baseWidth = container.height * ratio;
  }
  const width = baseWidth * t.scale;
  const height = baseHeight * t.scale;
  const extraX = container.width - width;
  const extraY = container.height - height;
  const minX = extraX >= 0 ? extraX / 2 : extraX;
  const maxX = extraX >= 0 ? extraX / 2 : 0;
  const minY = extraY >= 0 ? extraY / 2 : extraY;
  const maxY = extraY >= 0 ? extraY / 2 : 0;
  return {
    scale: t.scale,
    x: Math.min(maxX, Math.max(minX, t.x)),
    y: Math.min(maxY, Math.max(minY, t.y)),
  };
}

interface Props {
  src: string;
  alt: string;
}

export default function ZoomableImage({ src, alt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  }>();
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDistance = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (lastDistance.current === null) {
        lastDistance.current = dist;
        lastCenter.current = center;
        return;
      }
      const scaleDelta = dist / lastDistance.current;
      lastDistance.current = dist;
      const dx = center.x - (lastCenter.current?.x ?? center.x);
      const dy = center.y - (lastCenter.current?.y ?? center.y);
      lastCenter.current = center;

      setTransform((t) => {
        const scale = Math.min(5, Math.max(1, t.scale * scaleDelta));
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return t;
        const originX = (center.x - rect.left - t.x) / t.scale;
        const originY = (center.y - rect.top - t.y) / t.scale;
        const x = t.x - (scale - t.scale) * originX + dx;
        const y = t.y - (scale - t.scale) * originY + dy;
        return constrainPan(rect, naturalSize, { scale, x, y });
      });
    } else if (pointers.current.size === 1 && lastDistance.current === null) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      setTransform((t) => {
        const rect = containerRef.current?.getBoundingClientRect();
        return constrainPan(rect, naturalSize, {
          scale: t.scale,
          x: t.x + dx,
          y: t.y + dy,
        });
      });
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      lastDistance.current = null;
      lastCenter.current = null;
    }
  }

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (e.ctrlKey) {
        let cursorX = e.clientX - rect.left;
        let cursorY = e.clientY - rect.top;
        const zoom = Math.exp(-e.deltaY / 200);
        setTransform((t) => {
          const baseRatio =
            (naturalSize?.width ?? 1) / (naturalSize?.height ?? 1);
          const containerRatio = rect.width / rect.height;
          let baseWidth: number;
          let baseHeight: number;
          if (baseRatio > containerRatio) {
            baseWidth = rect.width;
            baseHeight = rect.width / baseRatio;
          } else {
            baseHeight = rect.height;
            baseWidth = rect.height * baseRatio;
          }
          const imgWidth = baseWidth * t.scale;
          const imgHeight = baseHeight * t.scale;
          const left = t.x;
          const top = t.y;
          const right = left + imgWidth;
          const bottom = top + imgHeight;
          if (
            cursorX < left ||
            cursorX > right ||
            cursorY < top ||
            cursorY > bottom
          ) {
            cursorX = left + imgWidth / 2;
            cursorY = top + imgHeight / 2;
          }
          const scale = Math.min(5, Math.max(1, t.scale * zoom));
          const originX = (cursorX - t.x) / t.scale;
          const originY = (cursorY - t.y) / t.scale;
          const x = t.x - (scale - t.scale) * originX - e.deltaX;
          const y = t.y - (scale - t.scale) * originY - e.deltaY;
          return constrainPan(rect, naturalSize, { scale, x, y });
        });
      } else {
        setTransform((t) =>
          constrainPan(rect, naturalSize, {
            scale: t.scale,
            x: t.x - e.deltaX,
            y: t.y - e.deltaY,
          }),
        );
      }
    },
    [naturalSize],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={src}
        alt={alt}
        ref={imgRef}
        onLoad={(e) =>
          setNaturalSize({
            width: (e.currentTarget as HTMLImageElement).naturalWidth,
            height: (e.currentTarget as HTMLImageElement).naturalHeight,
          })
        }
        draggable={false}
        className="object-contain select-none absolute inset-0 w-full h-full"
        loading="lazy"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
      />
      {(transform.scale !== 1 || transform.x !== 0 || transform.y !== 0) && (
        <button
          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
          type="button"
          onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
        >
          Reset zoom
        </button>
      )}
    </div>
  );
}
