import { useRef, useState } from "react";

export interface PinchZoomProps {
  children: React.ReactNode;
  className?: string;
}

export default function PinchZoom({ children, className }: PinchZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDistance = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const lastSingle = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const updateScale = (nextScale: number, center: { x: number; y: number }) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = center.x - rect.left;
    const cy = center.y - rect.top;
    setOffset((o) => ({
      x: cx - ((cx - o.x) / scale) * nextScale,
      y: cy - ((cy - o.y) / scale) * nextScale,
    }));
    setScale(nextScale);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    containerRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastSingle.current = { x: e.clientX, y: e.clientY };
    }
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      lastDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
      lastCenter.current = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      const dx = e.clientX - lastSingle.current.x;
      const dy = e.clientY - lastSingle.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      lastSingle.current = { x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ratio = dist / lastDistance.current;
      updateScale(Math.max(1, scale * ratio), center);
      lastDistance.current = dist;
      lastCenter.current = center;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    updateScale(Math.max(1, scale * factor), { x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className={className}
      style={{ touchAction: "none", overflow: "hidden" }}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
