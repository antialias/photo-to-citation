import type { NextConfig } from "next";
import { config } from "./src/lib/config";

if (!config.NEXTAUTH_SECRET) {
  console.error(
    "NEXTAUTH_SECRET environment variable must be set to preserve sessions",
  );
  process.exit(1);
}

const basePath = config.NEXT_PUBLIC_BASE_PATH || "";
const assetPrefix = basePath ? `${basePath}/` : undefined;

const nextConfig: NextConfig = {
  basePath,
  assetPrefix,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "staticmap.openstreetmap.de",
      },
    ],
  },
};

export default nextConfig;
