"use client";
import { useState } from "react";
import { css } from "styled-system/css";
import TranslateIcon from "./TranslateIcon";

export default function InlineTranslateButton({
  lang,
  onTranslate,
}: {
  lang: string;
  onTranslate: () => Promise<void> | void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    if (state === "loading") return;
    setState("loading");
    try {
      await Promise.resolve(onTranslate());
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="translate"
      className={css({
        ml: "2",
        color: "blue.500",
        _hover: { color: "blue.700" },
      })}
    >
      <TranslateIcon
        lang={lang}
        loading={state === "loading"}
        error={state === "error"}
      />
    </button>
  );
}
