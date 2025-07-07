"use client";
import { radii } from "@/styleTokens";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { css, cva } from "styled-system/css";
import { token } from "styled-system/tokens";

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const styles = {
    overlay: css({
      position: "fixed",
      inset: 0,
      bg: token("colors.overlay"),
    }),
    content: css({
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "4",
    }),
    dialog: css({
      bg: token("colors.surface"),
      borderRadius: radii.default,
      boxShadow: token("shadows.default"),
      maxW: "sm",
      w: "full",
    }),
    footer: css({
      display: "flex",
      justifyContent: "flex-end",
      gap: "2",
      p: "4",
    }),
    message: css({ p: "4" }),
  };

  const actionButton = cva({
    base: {
      px: "2",
      py: "1",
      borderRadius: radii.default,
    },
    variants: {
      variant: {
        cancel: { bg: { base: "gray.200", _dark: "gray.700" } },
        confirm: { bg: "blue.600", color: "white" },
      },
    },
  });
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className={`z-modal ${styles.overlay}`} />
        <Dialog.Content className={`z-modal ${styles.content}`}>
          <div className={styles.dialog}>
            <p className={styles.message}>{message}</p>
            <div className={styles.footer}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={onCancel}
                  className={actionButton({ variant: "cancel" })}
                >
                  {t("close")}
                </button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={actionButton({ variant: "confirm" })}
                >
                  {t("save")}
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
