"use client";

import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import { signIn, signOut, useSession } from "@/app/useSession";
import * as Popover from "@radix-ui/react-popover";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBars, FaUserCircle } from "react-icons/fa";
import SystemLanguageBanner from "./SystemLanguageBanner";

export default function NavBar() {
  const pathname = usePathname();
  const uploadCase = useNewCaseFromFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { i18n, t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [systemLang, setSystemLang] = useState<string | null>(null);
  const [showLangPrompt, setShowLangPrompt] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const supported = ["en", "es", "fr"];
    for (const l of navigator.languages ?? []) {
      const code = l.toLowerCase().split("-")[0];
      if (supported.includes(code)) {
        setSystemLang(code);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (systemLang && systemLang !== i18n.language) {
      setShowLangPrompt(true);
    }
  }, [systemLang, i18n.language]);
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
      <Link
        href="/snail-mail"
        className="hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.snailMail")}
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
      {/* user menu items removed from navLinks */}
    </>
  );

  const userMenu = (
    <details className="relative" onToggle={() => setMenuOpen(false)}>
      <summary className="cursor-pointer list-none flex items-center">
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt="avatar"
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="w-6 h-6" />
        )}
      </summary>
      <div className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow text-sm">
        {session ? (
          <>
            <Link
              href="/settings"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("nav.userSettings")}
            </Link>
            <Link
              href={`/public/users/${session.user?.id}`}
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("nav.publicProfile")}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              {t("nav.signOut")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => signIn()}
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            {t("nav.signIn")}
          </button>
        )}
      </div>
    </details>
  );

  return (
    <>
      {showLangPrompt && systemLang ? (
        <SystemLanguageBanner
          lang={systemLang}
          onSwitch={() => {
            i18n.changeLanguage(systemLang);
            setShowLangPrompt(false);
          }}
          onDismiss={() => setShowLangPrompt(false)}
        />
      ) : null}
      <nav className="py-4 px-8 flex items-center justify-between bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative sticky top-0 z-nav">
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
          {userMenu}
        </div>
        <div className="sm:hidden flex items-center gap-2">
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="sm:hidden text-xl p-2 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={t("menu")}
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
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          {userMenu}
        </div>
      </nav>
    </>
  );
}
