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
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
};

export default config;
