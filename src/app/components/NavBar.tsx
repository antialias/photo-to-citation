"use client";

import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import { signIn, signOut, useSession } from "@/app/useSession";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBars } from "react-icons/fa";
import LanguageSwitcher from "./LanguageSwitcher";

export default function NavBar() {
  const pathname = usePathname();
  const uploadCase = useNewCaseFromFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  if (pathname.startsWith("/point")) {
    return (
      <nav className="p-2 flex justify-end bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Link href="/cases" className="text-sm underline">
          {t("nav.cases")}
        </Link>
      </nav>
    );
  }
  const navLinks = (
    <>
      <button
        type="button"
        className="hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => {
          setMenuOpen(false);
          inputRef.current?.click();
        }}
      >
        {t("nav.newCaseFromImage")}
      </button>
      <Link
        href="/point"
        className="hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.pointShoot")}
      </Link>
      <Link
        href="/cases"
        className="hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.cases")}
      </Link>
      <Link
        href="/map"
        className="hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.mapView")}
      </Link>
      {session ? (
        <Link
          href="/triage"
          className="hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.triage")}
        </Link>
      ) : null}
      {session?.user?.role === "admin" ||
      session?.user?.role === "superadmin" ? (
        <Link
          href="/admin"
          className="hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.admin")}
        </Link>
      ) : null}
      {session?.user?.role === "superadmin" ? (
        <Link
          href="/system-status"
          className="hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.systemStatus")}
        </Link>
      ) : null}
      {session ? (
        <>
          <Link
            href="/settings"
            className="hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setMenuOpen(false)}
          >
            {t("nav.userSettings")}
          </Link>
          <Link
            href="/profile"
            className="hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setMenuOpen(false)}
          >
            {t("nav.profile")}
          </Link>
        </>
      ) : null}
      {session ? (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            signOut();
          }}
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          {t("nav.signOut")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            signIn();
          }}
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          {t("nav.signIn")}
        </button>
      )}
    </>
  );

  return (
    <nav className="py-4 px-8 flex items-center justify-between bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative sticky top-0 z-10">
      <Link
        href="/"
        className="text-lg font-semibold hover:text-gray-600 dark:hover:text-gray-300"
      >
        {t("title")}
      </Link>
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        ref={inputRef}
        onChange={(e) => uploadCase(e.target.files)}
      />
      <div className="hidden sm:flex gap-4 sm:gap-6 md:gap-8 text-sm items-center">
        {navLinks}
        <LanguageSwitcher />
      </div>
      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="sm:hidden text-xl p-2 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Menu"
          >
            <FaBars />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={4}
            className="sm:hidden flex flex-col gap-2 text-sm bg-gray-100 dark:bg-gray-900 border rounded shadow p-4"
          >
            {navLinks}
            <LanguageSwitcher />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </nav>
  );
}
