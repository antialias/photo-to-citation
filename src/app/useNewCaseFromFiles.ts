"use client";

import { apiFetch } from "@/apiClient";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useNotify } from "./components/NotificationProvider";

export default function useNewCaseFromFiles() {
  const router = useRouter();
  const notify = useNotify();
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      apiFetch("/api/upload", { method: "POST", body: formData }),
  });
  return async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const id = crypto.randomUUID();
    const preview = URL.createObjectURL(files[0]);
    sessionStorage.setItem(`preview-${id}`, preview);
    const results = await Promise.all(
      Array.from(files).map((file, idx) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", id);
        const upload = uploadMutation.mutateAsync(formData);
        if (idx === 0) {
          upload.then(() => {
            sessionStorage.removeItem(`preview-${id}`);
          });
        }
        return upload;
      }),
    );
    if (results.some((r) => !r.ok)) {
      notify("Failed to upload one or more files.");
      return;
    }
    router.push(`/cases/${id}`);
  };
}
