import type { StorybookConfig } from "@storybook/nextjs";

import path from "node:path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/nextjs",
    options: { builder: { useSWC: true } },
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve ?? { alias: {}, modules: [] };
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@/lib/stats": path.resolve(process.cwd(), ".storybook", "StatsStub.ts"),
      "@/app/components/MapPreview": path.resolve(
        process.cwd(),
        ".storybook",
        "MapPreviewStub.tsx",
      ),
      "next-auth/react": path.resolve(
        process.cwd(),
        ".storybook",
        "NextAuthStub.tsx",
      ),
      "styled-system": path.resolve(process.cwd(), "styled-system"),
      "@": path.resolve(process.cwd(), "src"),
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      net: false,
      tls: false,
      http: false,
      https: false,
    };
    return config;
  },
};

export default config;
