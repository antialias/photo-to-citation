import Image from "next/image";

export default function MapPreview({
  lat,
  lon,
  width,
  height,
  className,
}: {
  lat: number;
  lon: number;
  width: number;
  height: number;
  className?: string;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const url = key
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=16&size=${width}x${height}&markers=color:red|${lat},${lon}&key=${key}`
    : `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=16&size=${width}x${height}&markers=${lat},${lon},red`;
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image
        src={url}
        alt={`Map preview at ${lat}, ${lon}`}
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );
}
