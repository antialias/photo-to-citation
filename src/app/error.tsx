"use client";
import { withBasePath } from "@/basePath";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-4">Please try again or report the issue.</p>
      <div className="flex gap-4 justify-center">
        <button type="button" onClick={reset} className="underline">
          Retry
        </button>
        <Link
          href="https://github.com/antialias/photo-to-citation/issues"
          className="underline"
        >
          Report Issue
        </Link>
      </div>
    </div>
  );
}
