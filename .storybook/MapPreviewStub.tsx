export default function MapPreviewStub({
  width,
  height,
  className,
}: { width: number; height: number; className?: string }) {
  return (
    <div
      className={className ?? ""}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='sans-serif' font-size='20'%3EMap Preview%3C/text%3E%3C/svg%3E"
        alt="Map preview placeholder"
        width={width}
        height={height}
        loading="lazy"
      />
    </div>
  );
}
