"use client";

import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import { signIn, signOut, useSession } from "@/app/useSession";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const uploadCase = useNewCaseFromFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
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
          href="/triage"
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          Triage
        </Link>
        {session?.user?.role === "admin" ||
        session?.user?.role === "superadmin" ? (
          <Link
            href="/admin"
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            Admin
          </Link>
        ) : null}
        <Link
          href="/settings"
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          User Settings
        </Link>
        {session ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            Sign Out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signIn()}
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
