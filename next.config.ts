import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const assetPrefix = basePath ? `${basePath}/` : undefined;

const nextConfig: NextConfig = {
  basePath,
  assetPrefix,
  experimental: {
    serverSourceMaps: true,
  },
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
  webpack: (config, {isServer}) => {
    if (isServer) {
      config.devtool = 'source-map'
    }
    return config
  },
};

export default nextConfig;
