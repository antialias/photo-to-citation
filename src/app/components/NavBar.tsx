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
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
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
    const styles = {
      wrapper: css({
        p: "2",
        display: "flex",
        justifyContent: "flex-end",
        bg: { base: "gray.100", _dark: "gray.900" },
        color: { base: "gray.900", _dark: "gray.100" },
      }),
      link: css({ fontSize: "sm", textDecorationLine: "underline" }),
    };
    return (
      <nav className={styles.wrapper}>
        <Link href="/cases" className={styles.link}>
          {t("nav.cases")}
        </Link>
      </nav>
    );
  }
  const navStyles = {
    link: css({
      _hover: { color: { base: "gray.600", _dark: "gray.300" } },
    }),
  };
  const navLinks = (
    <>
      <button
        type="button"
        className={navStyles.link}
        onClick={() => {
          setMenuOpen(false);
          inputRef.current?.click();
        }}
      >
        {t("nav.newCaseFromImage")}
      </button>
      <Link
        href="/point"
        className={navStyles.link}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.pointShoot")}
      </Link>
      <Link
        href="/cases"
        className={navStyles.link}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.cases")}
      </Link>
      <Link
        href="/map"
        className={navStyles.link}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.mapView")}
      </Link>
      <Link
        href="/snail-mail"
        className={navStyles.link}
        onClick={() => setMenuOpen(false)}
      >
        {t("nav.snailMail")}
      </Link>
      {session ? (
        <Link
          href="/triage"
          className={navStyles.link}
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.triage")}
        </Link>
      ) : null}
      {session?.user?.role === "admin" ||
      session?.user?.role === "superadmin" ? (
        <Link
          href="/admin"
          className={navStyles.link}
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.admin")}
        </Link>
      ) : null}
      {/* user menu items removed from navLinks */}
    </>
  );

  const userStyles = {
    details: css({ position: "relative" }),
    summary: css({
      cursor: "pointer",
      listStyle: "none",
      display: "flex",
      alignItems: "center",
    }),
    avatar: css({
      width: "1.5rem",
      height: "1.5rem",
      borderRadius: "9999px",
      objectFit: "cover",
    }),
    menu: css({
      position: "absolute",
      right: 0,
      mt: "1",
      bg: { base: "white", _dark: "gray.900" },
      borderWidth: "1px",
      borderRadius: token("radii.md"),
      boxShadow: token("shadows.md"),
      fontSize: "sm",
    }),
    menuItem: css({
      display: "block",
      px: "4",
      py: "2",
      textAlign: "left",
      _hover: { bg: { base: "gray.100", _dark: "gray.700" } },
    }),
  };
  const userMenu = (
    <details className={userStyles.details} onToggle={() => setMenuOpen(false)}>
      <summary className={userStyles.summary}>
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt="avatar"
            width={24}
            height={24}
            className={userStyles.avatar}
          />
        ) : (
          <FaUserCircle className={userStyles.avatar} />
        )}
      </summary>
      <div className={userStyles.menu}>
        {session ? (
          <>
            <Link href="/settings" className={userStyles.menuItem}>
              {t("nav.userSettings")}
            </Link>
            <Link
              href={`/public/users/${session.user?.id}`}
              className={userStyles.menuItem}
            >
              {t("nav.publicProfile")}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className={userStyles.menuItem}
            >
              {t("nav.signOut")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => signIn()}
            className={userStyles.menuItem}
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
          onSwitch={async () => {
            document.cookie = `language=${systemLang}; path=/; max-age=31536000`;
            if (session) {
              await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: systemLang }),
              });
            }
            i18n.changeLanguage(systemLang);
            setShowLangPrompt(false);
          }}
          onDismiss={() => setShowLangPrompt(false)}
        />
      ) : null}
      <nav
        className={css({
          py: "4",
          px: "8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bg: { base: "gray.100", _dark: "gray.900" },
          color: { base: "gray.900", _dark: "gray.100" },
          position: "sticky",
          top: 0,
          zIndex: "var(--z-nav)",
        })}
      >
        <Link
          href="/"
          className={css({
            fontSize: "lg",
            fontWeight: "semibold",
            _hover: { color: { base: "gray.600", _dark: "gray.300" } },
          })}
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
        <div
          className={css({
            display: { base: "none", sm: "flex" },
            gap: { base: "4", sm: "6", md: "8" },
            fontSize: "sm",
            alignItems: "center",
          })}
        >
          {navLinks}
          {userMenu}
        </div>
        <div
          className={css({
            display: { base: "flex", sm: "none" },
            alignItems: "center",
            gap: "2",
          })}
        >
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={css({
                  display: { sm: "none" },
                  fontSize: "xl",
                  p: "2",
                  _hover: { color: { base: "gray.600", _dark: "gray.300" } },
                })}
                aria-label={t("menu")}
              >
                <FaBars />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={4}
                className={css({
                  display: { base: "flex", sm: "none" },
                  flexDirection: "column",
                  gap: "2",
                  fontSize: "sm",
                  bg: { base: "gray.100", _dark: "gray.900" },
                  borderWidth: "1px",
                  borderRadius: token("radii.md"),
                  boxShadow: token("shadows.md"),
                  p: "4",
                })}
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
