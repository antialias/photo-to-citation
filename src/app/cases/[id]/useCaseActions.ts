"use client";

import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import type { Case } from "@/lib/caseStore";
import { getCasePlateNumber, getCasePlateState } from "@/lib/caseUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotify } from "../../components/NotificationProvider";
import { caseQueryKey } from "../../hooks/useCase";
import { caseMembersQueryKey } from "../../hooks/useCaseMembers";
import { useCaseContext } from "./CaseContext";

export default function useCaseActions() {
  const {
    caseId,
    caseData,
    refreshCase,
    updateVehicle,
    inviteMember,
    removeMember,
    uploadFiles,
    handleUpload,
    fileInputRef,
  } = useCaseContext();
  const notify = useNotify();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<string | null>(null);

  const updateVinMutation = useMutation({
    async mutationFn(value: string) {
      const res = await apiFetch(`/api/cases/${caseId}/vin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: value || null }),
      });
      if (!res.ok) throw new Error("Failed to update VIN.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to update VIN.");
    },
  });

  const clearVinMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/vin`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear VIN.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to clear VIN.");
    },
  });

  const updateNoteMutation = useMutation({
    async mutationFn(value: string) {
      const res = await apiFetch(`/api/cases/${caseId}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value || null }),
      });
      if (!res.ok) throw new Error("Failed to update note.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to update note.");
    },
  });

  const updatePhotoNoteMutation = useMutation({
    async mutationFn({ photo, value }: { photo: string; value: string }) {
      const res = await apiFetch(`/api/cases/${caseId}/photo-note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, note: value || null }),
      });
      if (!res.ok) throw new Error("Failed to update note.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to update note.");
    },
  });

  const togglePublicMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/public`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: !(caseData?.public ?? false) }),
      });
      if (!res.ok) throw new Error("Failed to update visibility.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to update visibility.");
    },
  });

  const toggleClosedMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/closed`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closed: !(caseData?.closed ?? false) }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to update status.");
    },
  });

  const toggleArchivedMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/archived`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !(caseData?.archived ?? false) }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to update status.");
    },
  });

  async function copyPublicUrl() {
    const url = `${window.location.origin}${withBasePath(`/public/cases/${caseId}`)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const reanalyzePhotoMutation = useMutation({
    async mutationFn({
      photo,
      detailsEl,
    }: { photo: string; detailsEl?: HTMLDetailsElement | null }) {
      const url = `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`;
      if (caseData)
        queryClient.setQueryData(caseQueryKey(caseId), {
          ...caseData,
          analysisStatus: "pending",
        });
      setReanalyzingPhoto(photo);
      const res = await apiFetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reanalyze photo.");
      if (detailsEl) detailsEl.open = false;
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to reanalyze photo.");
    },
  });

  const retryAnalysisMutation = useMutation({
    async mutationFn() {
      if (caseData)
        queryClient.setQueryData(caseQueryKey(caseId), {
          ...caseData,
          analysisStatus: "pending",
        });
      const res = await apiFetch(`/api/cases/${caseId}/reanalyze`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to retry analysis.");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify("Failed to retry analysis.");
    },
  });

  const removePhotoMutation = useMutation({
    async mutationFn(photo: string) {
      const delRes = await apiFetch(`/api/cases/${caseId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo }),
      });
      if (!delRes.ok) throw new Error("Failed to remove photo.");
      const res = await apiFetch(`/api/cases/${caseId}`);
      if (res.ok) {
        queryClient.setQueryData(caseQueryKey(caseId), await res.json());
      } else {
        throw new Error("Failed to refresh case after removing photo.");
      }
    },
    async onSuccess() {
      router.refresh();
      const confirmed = window.confirm(
        "Photo removed. Reanalyze this case now?",
      );
      if (confirmed) {
        await apiFetch(`/api/cases/${caseId}/reanalyze`, { method: "POST" });
        router.refresh();
      }
    },
    onError() {
      notify("Failed to remove photo.");
    },
  });

  const updateVin = (value: string) => updateVinMutation.mutateAsync(value);
  const clearVin = () => clearVinMutation.mutateAsync();
  const updateNote = (value: string) => updateNoteMutation.mutateAsync(value);
  const updatePhotoNote = (photo: string, value: string) =>
    updatePhotoNoteMutation.mutateAsync({ photo, value });
  const togglePublic = () => togglePublicMutation.mutate();
  const toggleClosed = () => toggleClosedMutation.mutate();
  const toggleArchived = () => toggleArchivedMutation.mutate();
  const reanalyzePhoto = (
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) => reanalyzePhotoMutation.mutate({ photo, detailsEl });
  const retryAnalysis = () => retryAnalysisMutation.mutate();
  const removePhoto = (photo: string) => removePhotoMutation.mutateAsync(photo);

  function updatePlateNumber(value: string) {
    const state = getCasePlateState(caseData as Case) || "";
    return updateVehicle(value, state);
  }

  function updatePlateState(value: string) {
    const plate = getCasePlateNumber(caseData as Case) || "";
    return updateVehicle(plate, value);
  }

  function clearPlateNumber() {
    const state = getCasePlateState(caseData as Case) || "";
    return updateVehicle("", state);
  }

  function clearPlateState() {
    const plate = getCasePlateNumber(caseData as Case) || "";
    return updateVehicle(plate, "");
  }

  return {
    copied,
    copyPublicUrl,
    reanalyzingPhoto,
    setReanalyzingPhoto,
    updateVin,
    clearVin,
    updateNote,
    updatePhotoNote,
    togglePublic,
    toggleClosed,
    toggleArchived,
    reanalyzePhoto,
    retryAnalysis,
    removePhoto,
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    inviteMember,
    removeMember,
    uploadFiles,
    handleUpload,
    fileInputRef,
  };
}
