export function createPhoto(name: string): File {
  const base64 =
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf///////////////////////////////////////////////////////////////////////////////////////wAARCAAaACkDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAP8A/9k=";
  const buffer = Buffer.from(base64, "base64");
  return new File([buffer], `${name}.jpg`, { type: "image/jpeg" });
}
