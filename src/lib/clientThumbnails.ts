export function getThumbnailUrl(url: string, size: number): string {
  const base = url.substring(url.lastIndexOf("/") + 1);
  return `/uploads/thumbs/${size}/${base}`;
}
