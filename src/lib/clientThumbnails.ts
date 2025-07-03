export function getThumbnailUrl(url: string, size: number): string {
  const base = url.substring(url.lastIndexOf("/") + 1);
  if (base.toLowerCase().endsWith(".pdf")) {
    return `/uploads/thumbs/${size}/${base}.jpg`;
  }
  return `/uploads/thumbs/${size}/${base}`;
}
