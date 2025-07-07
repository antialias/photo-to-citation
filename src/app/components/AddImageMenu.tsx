"use client";
import { radii } from "@/styleTokens";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import { css, cva } from "styled-system/css";
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
      borderRadius: radii.default,
      width: token("sizes.20"),
      aspectRatio: token("aspectRatios.landscape"),
      fontSize: "sm",
      color: token("colors.text-muted"),
      cursor: "pointer",
      userSelect: "none",
    }),
    content: css({
      bg: token("colors.surface"),
      borderWidth: "1px",
      borderRadius: radii.default,
      boxShadow: token("shadows.default"),
      color: { base: "black", _dark: "white" },
    }),
  };

  const menuItem = cva({
    base: {
      display: "block",
      px: "4",
      py: "2",
      w: "full",
      textAlign: "left",
      _hover: { bg: token("colors.surface-subtle") },
    },
  });
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
