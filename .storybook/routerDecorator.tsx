"use client";
import type { Decorator, StoryFn } from "@storybook/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathParamsContext,
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";

const router = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => Promise.resolve(),
};

export const withRouter: Decorator = (Story: StoryFn) => {
  const StoryComponent = Story as unknown as React.FC;
  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value="/">
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <PathParamsContext.Provider value={{}}>
            <StoryComponent />
          </PathParamsContext.Provider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
};
