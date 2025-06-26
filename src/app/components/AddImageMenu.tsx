"use client";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { type RefObject, useState } from "react";

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
  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex items-center justify-center border rounded w-20 aspect-[4/3] text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none"
          >
            + add image
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={4}
            className="bg-white dark:bg-gray-900 border rounded shadow text-black dark:text-white"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                fileInputRef.current?.click();
              }}
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              Upload Image
            </button>
            {hasCamera ? (
              <Link
                href={`/point?case=${caseId}`}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                onClick={() => setOpen(false)}
              >
                Take Photo
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
        className="hidden"
      />
    </>
  );
}
