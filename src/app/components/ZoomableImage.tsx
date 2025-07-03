"use client";
import { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

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

export default function ZoomableImage({
  src,
  alt,
}: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  return (
    <TransformWrapper
      maxScale={5}
      wheel={{ step: 0.2 }}
      onZoomStop={(ref) => setScale(ref.state.scale)}
      onPanningStop={(ref) => setScale(ref.state.scale)}
    >
      {({ resetTransform }) => (
        <div className="w-full h-full relative">
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full"
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="object-contain select-none w-full h-full"
              loading="lazy"
            />
          </TransformComponent>
          {scale > 1 ? (
            <button
              type="button"
              onClick={() => resetTransform()}
              className="absolute top-1 left-1 z-sticky bg-black/60 text-white rounded px-1 text-xs"
            >
              Reset zoom
            </button>
          ) : null}
        </div>
      )}
    </TransformWrapper>
  );
}
