"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import queryClient from "./queryClient";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (mod) => mod.ReactQueryDevtools,
    ),
  { ssr: false },
);

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
