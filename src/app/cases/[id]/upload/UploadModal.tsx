"use client";
import useAddFilesToCase from "@/app/useAddFilesToCase";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef } from "react";

export default function UploadModal({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useAddFilesToCase(caseId);

  useEffect(() => {
    inputRef.current?.click();
  }, []);

  async function handleChange(files: FileList | null) {
    await upload(files);
    onClose();
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded shadow p-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleChange(e.target.files)}
            />
            <div className="flex justify-end mt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
