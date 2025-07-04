"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

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
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-modal" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-modal">
          <div className="bg-white dark:bg-gray-900 rounded shadow max-w-sm w-full">
            <p className="p-4">{message}</p>
            <div className="flex justify-end gap-2 p-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  {t("close")}
                </button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="bg-blue-600 text-white px-2 py-1 rounded"
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
