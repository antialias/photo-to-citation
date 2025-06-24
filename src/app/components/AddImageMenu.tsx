"use client";
import Tippy from "@tippyjs/react";
import Link from "next/link";
import { type RefObject, useEffect, useState } from "react";

export default function AddImageMenu({
  caseId,
  hasCamera,
  fileInputRef,
  onChange,
}: {
  caseId: string;
  hasCamera: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    import("tippy.js/dist/tippy.css");
  }, []);
  return (
    <>
      <Tippy
        content={
          <div className="bg-white dark:bg-gray-900 border rounded shadow text-black dark:text-white">
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
          </div>
        }
        visible={open}
        interactive
        placement="auto"
        onClickOutside={() => setOpen(false)}
      >
        <button
          type="button"
          className="flex items-center justify-center border rounded w-20 aspect-[4/3] text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none"
          onClick={() => setOpen((v) => !v)}
        >
          + add image
        </button>
      </Tippy>
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
