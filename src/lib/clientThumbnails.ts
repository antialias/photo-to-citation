export function getThumbnailUrl(name: string, size: number): string {
  return `/uploads/thumbs/${size}/${name}`;
}
