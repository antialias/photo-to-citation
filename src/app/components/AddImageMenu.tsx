"use client";
import { menuItem } from "@/components/ui/menuItem";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export default function AddImageMenu({
  caseId,
  hasCamera,
  fileInputRef,
  onChange,
}: {
  caseId: string;
  hasCamera: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const styles = {
    trigger: css({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: "1px",
      borderRadius: "sm",
      width: token("sizes.20"),
      aspectRatio: token("aspectRatios.landscape"),
      fontSize: "sm",
      color: {
        base: token("colors.gray.500"),
        _dark: token("colors.gray.400"),
      },
      cursor: "pointer",
      userSelect: "none",
    }),
    content: css({
      bg: { base: "white", _dark: "gray.900" },
      borderWidth: "1px",
      borderRadius: "sm",
      boxShadow: token("shadows.default"),
      color: { base: "black", _dark: "white" },
    }),
  };

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className={styles.trigger}>
            {t("addImage")}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={4} className={styles.content}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                fileInputRef.current?.click();
              }}
              className={menuItem()}
            >
              {t("uploadImage")}
            </button>
            {hasCamera ? (
              <Link
                href={`/point?case=${caseId}`}
                className={menuItem()}
                onClick={() => setOpen(false)}
              >
                {t("takePhoto")}
              </Link>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
        className={css({ display: "none" })}
      />
    </>
  );
}
