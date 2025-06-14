"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import useNewCaseFromFiles from "../useNewCaseFromFiles";

export default function NavBar() {
  const pathname = usePathname();
  const uploadCase = useNewCaseFromFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  if (pathname.startsWith("/point")) {
    return (
      <nav className="p-2 flex justify-end bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Link href="/cases" className="text-sm underline">
          Cases
        </Link>
      </nav>
    );
  }
  return (
    <nav className="py-4 px-8 flex items-center justify-between bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Link
        href="/"
        className="text-lg font-semibold hover:text-gray-600 dark:hover:text-gray-300"
      >
        Photo To Citation
      </Link>
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        ref={inputRef}
        onChange={(e) => uploadCase(e.target.files)}
      />
      <div className="flex gap-4 sm:gap-6 md:gap-8 text-sm">
        <button
          type="button"
          className="hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => inputRef.current?.click()}
        >
          New Case from Image
        </button>
        <Link
          href="/point"
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          Point &amp; Shoot
        </Link>
        <Link
          href="/cases"
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          Cases
        </Link>
        <Link
          href="/map"
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          Map View
        </Link>
        <Link
          href="/settings"
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          Settings
        </Link>
      </div>
    </nav>
  );
}
