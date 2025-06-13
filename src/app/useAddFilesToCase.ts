"use client";

import { useRouter } from "next/navigation";
import type { Case } from "../lib/caseStore";

export default function useAddFilesToCase(
  caseId: string,
  onUpdate?: (c: Case) => void,
) {
  const router = useRouter();
  return async (files: FileList | File[] | null) => {
    if (
      !files ||
      (files instanceof FileList ? files.length === 0 : files.length === 0)
    )
      return;
    const arr =
      files instanceof FileList ? Array.from(files) : Array.from(files);
    await Promise.all(
      arr.map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", caseId);
        return fetch("/api/upload", { method: "POST", body: formData });
      }),
    );
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      onUpdate?.(data);
    }
    router.refresh();
  };
}
