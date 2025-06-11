import type { Decorator } from "@storybook/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

const router = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => Promise.resolve(),
};

export const withRouter: Decorator = (Story) => (
  <AppRouterContext.Provider value={router}>
    {Story()}
  </AppRouterContext.Provider>
);
