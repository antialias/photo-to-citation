import type { NextConfig } from "next";

if (!process.env.NEXTAUTH_SECRET) {
  console.error(
    "NEXTAUTH_SECRET environment variable must be set to preserve sessions",
  );
  process.exit(1);
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
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
