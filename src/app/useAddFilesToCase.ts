"use client";

import { apiFetch } from "@/apiClient";
import { useRouter } from "next/navigation";
import { useNotify } from "./components/NotificationProvider";

export default function useAddFilesToCase(caseId: string) {
  const router = useRouter();
  const notify = useNotify();
  return async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const results = await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", caseId);
        return apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
      }),
    );
    if (results.some((r) => !r.ok)) {
      notify("Failed to upload one or more files.");
      return;
    }
    router.push(`/cases/${caseId}`);
  };
}
