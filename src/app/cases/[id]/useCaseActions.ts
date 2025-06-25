"use client";

import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import type { Case } from "@/lib/caseStore";
import { getCasePlateNumber, getCasePlateState } from "@/lib/caseUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotify } from "../../components/NotificationProvider";
import { useCaseContext } from "./CaseContext";

export default function useCaseActions() {
  const {
    caseId,
    caseData,
    setCaseData,
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
  const [copied, setCopied] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<string | null>(null);

  async function updateVin(value: string) {
    const res = await apiFetch(`/api/cases/${caseId}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: value || null }),
    });
    if (!res.ok) {
      notify("Failed to update VIN.");
      return;
    }
    await refreshCase();
  }

  async function clearVin() {
    const res = await apiFetch(`/api/cases/${caseId}/vin`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify("Failed to clear VIN.");
      return;
    }
    await refreshCase();
  }

  async function updateNote(value: string) {
    const res = await apiFetch(`/api/cases/${caseId}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: value || null }),
    });
    if (!res.ok) {
      notify("Failed to update note.");
      return;
    }
    await refreshCase();
  }

  async function updatePhotoNote(photo: string, value: string) {
    const res = await apiFetch(`/api/cases/${caseId}/photo-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo, note: value || null }),
    });
    if (!res.ok) {
      notify("Failed to update note.");
      return;
    }
    await refreshCase();
  }

  async function togglePublic() {
    const res = await apiFetch(`/api/cases/${caseId}/public`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: !(caseData?.public ?? false) }),
    });
    if (!res.ok) {
      notify("Failed to update visibility.");
      return;
    }
    await refreshCase();
  }

  async function toggleClosed() {
    const res = await apiFetch(`/api/cases/${caseId}/closed`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closed: !(caseData?.closed ?? false) }),
    });
    if (!res.ok) {
      notify("Failed to update status.");
      return;
    }
    await refreshCase();
  }

  async function toggleArchived() {
    const res = await apiFetch(`/api/cases/${caseId}/archived`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !(caseData?.archived ?? false) }),
    });
    if (!res.ok) {
      notify("Failed to update status.");
      return;
    }
    await refreshCase();
  }

  async function copyPublicUrl() {
    const url = `${window.location.origin}${withBasePath(`/public/cases/${caseId}`)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function reanalyzePhoto(
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) {
    const url = `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`;
    if (caseData) setCaseData({ ...caseData, analysisStatus: "pending" });
    setReanalyzingPhoto(photo);
    const res = await apiFetch(url, { method: "POST" });
    if (res.ok) {
      if (detailsEl) detailsEl.open = false;
    } else {
      notify("Failed to reanalyze photo.");
    }
    await refreshCase();
  }

  async function retryAnalysis() {
    if (caseData) setCaseData({ ...caseData, analysisStatus: "pending" });
    const res = await apiFetch(`/api/cases/${caseId}/reanalyze`, {
      method: "POST",
    });
    if (!res.ok) notify("Failed to retry analysis.");
    await refreshCase();
  }

  async function removePhoto(photo: string) {
    const delRes = await apiFetch(`/api/cases/${caseId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    if (!delRes.ok) {
      notify("Failed to remove photo.");
      return;
    }
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    } else {
      notify("Failed to refresh case after removing photo.");
    }
    router.refresh();
    const confirmed = window.confirm("Photo removed. Reanalyze this case now?");
    if (confirmed) {
      await apiFetch(`/api/cases/${caseId}/reanalyze`, { method: "POST" });
      router.refresh();
    }
  }

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
