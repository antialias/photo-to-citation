export function getStaticMapUrl(
  coords: { lat: number; lon: number },
  opts: { width?: number; height?: number; zoom?: number } = {},
): string {
  const { width = 300, height = 200, zoom = 15 } = opts;
  const params = new URLSearchParams({
    center: `${coords.lat},${coords.lon}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    markers: `${coords.lat},${coords.lon}`,
  });
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (key) params.set("key", key);
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
