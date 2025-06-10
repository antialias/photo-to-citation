import Image from "next/image";

export default function MapPreview({
  lat,
  lon,
  width,
  height,
}: {
  lat: number;
  lon: number;
  width: number;
  height: number;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const url = key
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=16&size=${width}x${height}&markers=color:red|${lat},${lon}&key=${key}`
    : `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=16&size=${width}x${height}&markers=${lat},${lon},red`;
  return <Image src={url} alt="map preview" width={width} height={height} />;
}
