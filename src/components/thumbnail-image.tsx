import { type ImgHTMLAttributes, useEffect, useState } from "react";
import { css, cx } from "styled-system/css";

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
      className={cx(
        css({ position: "relative", overflow: "hidden" }),
        className,
      )}
    >
      {!ready && (
        <div
          className={css({
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: { base: "gray.200", _dark: "gray.800" },
          })}
        >
          <div
            className={css({
              width: "6",
              height: "6",
              borderWidth: "2px",
              borderColor: "gray.500",
              borderTopColor: "transparent",
              borderRadius: "full",
              animation: "spin",
            })}
          />
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
        className={cx(
          css({ objectFit: "cover", maxW: "full", maxH: "full" }),
          imgClassName,
          !ready ? css({ visibility: "hidden" }) : undefined,
        )}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
