import { getPublicEnv } from "@/publicEnv";
import { css, cx } from "styled-system/css";

export default function MapPreview({
  lat,
  lon,
  width,
  height,
  className,
  link,
}: {
  lat: number;
  lon: number;
  width: number;
  height: number;
  className?: string;
  link?: string;
}) {
  const { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: key } = getPublicEnv();
  const url = key
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=16&size=${width}x${height}&markers=color:red|${lat},${lon}&key=${key}`
    : `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=16&size=${width}x${height}&markers=${lat},${lon},red`;
  const styles = {
    wrapper: css({ position: "relative" }),
    image: css({
      objectFit: "cover",
      position: "absolute",
      inset: "0",
      w: "full",
      h: "full",
    }),
    link: css({ position: "absolute", inset: "0" }),
  };
  return (
    <div
      className={cx(styles.wrapper, className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src={url}
        alt={`Map preview at ${lat}, ${lon}`}
        className={styles.image}
        loading="lazy"
      />
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          <span className="sr-only">View on map</span>
        </a>
      ) : null}
    </div>
  );
}
