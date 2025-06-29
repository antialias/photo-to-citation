"use client";

import { apiFetch } from "@/apiClient";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useNotify } from "./components/NotificationProvider";

export default function useAddFilesToCase(caseId: string) {
  const router = useRouter();
  const notify = useNotify();
  const { t } = useTranslation();
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      apiFetch("/api/upload", { method: "POST", body: formData }),
  });
  return async (
    files: FileList | null,
    gps?: { lat: number; lon: number } | null,
  ) => {
    if (!files || files.length === 0) return;
    const results = await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", caseId);
        if (gps) {
          formData.append("lat", String(gps.lat));
          formData.append("lon", String(gps.lon));
        }
        return uploadMutation.mutateAsync(formData);
      }),
    );
    if (results.some((r) => !r.ok)) {
      notify(t("failedUpload"));
      return;
    }
    router.push(`/cases/${caseId}`);
  };
}
