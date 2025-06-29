"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import queryClient from "./queryClient";

export default function QueryProvider({
  children,
}: { children: React.ReactNode }) {
  const showReactQueryDevTools =
    process.env.SHOW_REACT_QUERY_DEV_TOOLS &&
    process.env.NODE_ENV === "development";
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showReactQueryDevTools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
