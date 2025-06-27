import { type ImgHTMLAttributes, useEffect, useState } from "react";

export interface ThumbnailImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "width" | "height" | "alt"
  > {
  src: string;
  alt: string;
  width: number;
  height: number;
  imgClassName?: string;
}

export default function ThumbnailImage({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
  ...props
}: ThumbnailImageProps) {
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (ready) return;
    const timer = setInterval(() => setAttempt((a) => a + 1), 2000);
    return () => clearInterval(timer);
  }, [ready]);

  return (
    <div
      style={{ width, height }}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
          <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* biome-ignore lint/a11y/useAltText: alt text provided via props */}
      <img
        src={`${src}${attempt ? `?${attempt}` : ""}`}
        alt={alt ?? ""}
        width={width}
        height={height}
        onLoad={() => setReady(true)}
        onError={() => setReady(false)}
        className={`object-cover max-w-full max-h-full ${imgClassName ?? ""} ${ready ? "" : "invisible"}`}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
