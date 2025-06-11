"use client";

import { useRouter } from "next/navigation";

export default function useNewCaseFromFiles() {
  const router = useRouter();
  return async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const id = Date.now().toString();
    const preview = URL.createObjectURL(files[0]);
    sessionStorage.setItem(`preview-${id}`, preview);
    await Promise.all(
      Array.from(files).map((file, idx) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", id);
        const upload = fetch("/api/upload", { method: "POST", body: formData });
        if (idx === 0) {
          upload.then(() => {
            sessionStorage.removeItem(`preview-${id}`);
          });
        }
        return upload;
      }),
    );
    router.push(`/cases/${id}`);
  };
}
