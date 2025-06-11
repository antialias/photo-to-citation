"use client";

import Link from "next/link";
import { useRef } from "react";
import useNewCaseFromFiles from "../useNewCaseFromFiles";

export default function NavBar() {
  const uploadCase = useNewCaseFromFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <nav className="bg-gray-900 text-white py-4 px-8 flex items-center justify-between">
      <Link href="/" className="text-lg font-semibold hover:text-gray-300">
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
      <div className="flex gap-6 text-sm">
        <button
          type="button"
          className="hover:text-gray-300"
          onClick={() => inputRef.current?.click()}
        >
          New Case from Image
        </button>
        <Link href="/cases" className="hover:text-gray-300">
          Cases
        </Link>
      </div>
    </nav>
  );
}
