"use client";

import { apiFetch } from "@/apiClient";
import useCaseAnalysisActive from "@/app/useCaseAnalysisActive";
import { withBasePath } from "@/basePath";
import type { Case } from "@/lib/caseStore";
import {
  getCasePlateNumber,
  getCasePlateState,
  getRepresentativePhoto,
} from "@/lib/caseUtils";
import type { LlmProgress } from "@/lib/openai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../components/NotificationProvider";
import useCase, { caseQueryKey } from "../../hooks/useCase";
import useCaseMembers, {
  caseMembersQueryKey,
} from "../../hooks/useCaseMembers";
import useEventSource from "../../hooks/useEventSource";

interface CaseMember {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
}

interface CaseContextValue {
  caseId: string;
  caseData: Case | null;
  members: CaseMember[];
  selectedPhoto: string | null;
  setSelectedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  refreshCase: () => Promise<void>;
  updateVehicle: (plateNum: string, plateState: string) => Promise<void>;
  inviteMember: (userId: string) => Promise<void>;
  uploadFiles: (files: FileList) => Promise<void>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  analysisActive: boolean;
  copied: boolean;
  copyPublicUrl: () => Promise<void>;
  reanalyzingPhoto: string | null;
  setReanalyzingPhoto: React.Dispatch<React.SetStateAction<string | null>>;
  updateVin: (value: string) => Promise<void>;
  clearVin: () => Promise<void>;
  updateNote: (value: string) => Promise<void>;
  updatePhotoNote: (photo: string, value: string) => Promise<void>;
  togglePublic: () => void;
  toggleClosed: () => void;
  toggleArchived: () => void;
  reanalyzePhoto: (photo: string) => Promise<void>;
  retryAnalysis: () => void;
  removePhoto: (photo: string) => Promise<void>;
  updatePlateNumber: (value: string) => Promise<void>;
  updatePlateState: (value: string) => Promise<void>;
  clearPlateNumber: () => Promise<void>;
  clearPlateState: () => Promise<void>;
  translate: (path: string, lang: string) => Promise<void>;
  progress: LlmProgress | null;
  progressDescription: string;
  requestValue?: number;
  isPhotoReanalysis: boolean;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({
  children,
  initialCase,
  caseId,
}: {
  children: React.ReactNode;
  initialCase: Case | null;
  caseId: string;
}) {
  const queryClient = useQueryClient();
  const { data: caseData = null } = useCase(caseId, initialCase);
  const { data: members = [] } = useCaseMembers(caseId);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    initialCase ? getRepresentativePhoto(initialCase) : null,
  );
  const notify = useNotify();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<string | null>(null);
  const analysisActive = useCaseAnalysisActive(
    caseId,
    caseData?.public ?? false,
  );

  useEventSource<Case & { deleted?: boolean }>("/api/cases/stream", (data) => {
    if (data.id !== caseId) return;
    if (data.deleted) {
      queryClient.setQueryData(caseQueryKey(caseId), null);
    } else {
      queryClient.setQueryData(caseQueryKey(caseId), data);
      sessionStorage.removeItem(`preview-${caseId}`);
    }
  });

  useEffect(() => {
    if (caseData) {
      setSelectedPhoto((prev) => {
        const all = new Set<string>([
          ...caseData.photos,
          ...(caseData.threadImages ?? []).map((img) => img.url),
        ]);
        return prev && all.has(prev) ? prev : getRepresentativePhoto(caseData);
      });
    }
  }, [caseData]);

  async function uploadFiles(files: FileList) {
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
    await refreshCase();
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) await uploadFiles(files);
  }

  async function refreshCase() {
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (!res.ok) {
      notify("Failed to refresh case.");
      return;
    }
    queryClient.setQueryData(caseQueryKey(caseId), await res.json());
  }

  async function updateVehicle(plateNum: string, plateState: string) {
    const res = await apiFetch(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: {
          licensePlateNumber: plateNum || undefined,
          licensePlateState: plateState || undefined,
        },
      }),
    });
    if (!res.ok) {
      notify("Failed to update vehicle information.");
      return;
    }
    await refreshCase();
  }

  async function refreshMembers() {
    const res = await apiFetch(`/api/cases/${caseId}/members`);
    if (res.ok)
      queryClient.setQueryData(caseMembersQueryKey(caseId), await res.json());
  }

  async function inviteMember(userId: string) {
    if (!userId) return;
    const res = await apiFetch(`/api/cases/${caseId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      notify("Failed to invite collaborator.");
      return;
    }
    await refreshMembers();
  }

  async function removeMember(uid: string) {
    const res = await apiFetch(`/api/cases/${caseId}/members/${uid}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify("Failed to remove collaborator.");
      return;
    }
    await refreshMembers();
  }

  const updateVinMutation = useMutation({
    async mutationFn(value: string) {
      const res = await apiFetch(`/api/cases/${caseId}/vin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: value || null }),
      });
      if (!res.ok) throw new Error(t("failedUpdateVin"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedUpdateVin"));
    },
  });

  const clearVinMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/vin`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("failedClearVin"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedClearVin"));
    },
  });

  const updateNoteMutation = useMutation({
    async mutationFn(value: string) {
      const res = await apiFetch(`/api/cases/${caseId}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value || null }),
      });
      if (!res.ok) throw new Error(t("failedUpdateNote"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedUpdateNote"));
    },
  });

  const updatePhotoNoteMutation = useMutation({
    async mutationFn({ photo, value }: { photo: string; value: string }) {
      const res = await apiFetch(`/api/cases/${caseId}/photo-note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, note: value || null }),
      });
      if (!res.ok) throw new Error(t("failedUpdateNote"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedUpdateNote"));
    },
  });

  const togglePublicMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/public`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: !(caseData?.public ?? false) }),
      });
      if (!res.ok) throw new Error(t("failedUpdateVisibility"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedUpdateVisibility"));
    },
  });

  const toggleClosedMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/closed`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closed: !(caseData?.closed ?? false) }),
      });
      if (!res.ok) throw new Error(t("failedUpdateStatus"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedUpdateStatus"));
    },
  });

  const toggleArchivedMutation = useMutation({
    async mutationFn() {
      const res = await apiFetch(`/api/cases/${caseId}/archived`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !(caseData?.archived ?? false) }),
      });
      if (!res.ok) throw new Error(t("failedUpdateStatus"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedUpdateStatus"));
    },
  });

  async function copyPublicUrl() {
    const url = `${window.location.origin}${withBasePath(`/public/cases/${caseId}`)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const reanalyzePhotoMutation = useMutation({
    async mutationFn({ photo }: { photo: string }) {
      const url = `/api/cases/${caseId}/reanalyze-photo?photo=${encodeURIComponent(photo)}`;
      if (caseData)
        queryClient.setQueryData(caseQueryKey(caseId), {
          ...caseData,
          analysisStatus: "pending",
        });
      setReanalyzingPhoto(photo);
      const res = await apiFetch(url, { method: "POST" });
      if (!res.ok) throw new Error(t("failedReanalyzePhoto"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedReanalyzePhoto"));
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
      if (!res.ok) throw new Error(t("failedRetryAnalysis"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedRetryAnalysis"));
    },
  });

  const removePhotoMutation = useMutation({
    async mutationFn(photo: string) {
      const delRes = await apiFetch(`/api/cases/${caseId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo }),
      });
      if (!delRes.ok) throw new Error(t("failedRemovePhoto"));
      const res = await apiFetch(`/api/cases/${caseId}`);
      if (res.ok) {
        queryClient.setQueryData(caseQueryKey(caseId), await res.json());
      } else {
        throw new Error(t("failedRefreshAfterRemove"));
      }
    },
    async onSuccess() {
      router.refresh();
      const confirmed = window.confirm(t("confirmReanalyze"));
      if (confirmed) {
        await apiFetch(`/api/cases/${caseId}/reanalyze`, { method: "POST" });
        router.refresh();
      }
    },
    onError() {
      notify(t("failedRemovePhoto"));
    },
  });

  const translateMutation = useMutation({
    async mutationFn({ path, lang }: { path: string; lang: string }) {
      const res = await apiFetch(`/api/cases/${caseId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, lang }),
      });
      if (!res.ok) throw new Error(t("failedToTranslate"));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    },
    onError() {
      notify(t("failedToTranslate"));
    },
  });

  const updateVin = (value: string) => updateVinMutation.mutateAsync(value);
  const clearVin = () => clearVinMutation.mutateAsync();
  const updateNote = (value: string) => updateNoteMutation.mutateAsync(value);
  const updatePhotoNote = (photo: string, value: string): Promise<void> =>
    updatePhotoNoteMutation.mutateAsync({ photo, value }).then(() => {});
  const togglePublic = () => togglePublicMutation.mutate();
  const toggleClosed = () => toggleClosedMutation.mutate();
  const toggleArchived = () => toggleArchivedMutation.mutate();
  const reanalyzePhoto = (photo: string): Promise<void> =>
    reanalyzePhotoMutation.mutateAsync({ photo }).then(() => {});
  const retryAnalysis = () => retryAnalysisMutation.mutate();
  const removePhoto = (photo: string) => removePhotoMutation.mutateAsync(photo);
  const translate = (path: string, lang: string): Promise<void> =>
    translateMutation.mutateAsync({ path, lang }).then(() => {});

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

  const progress: LlmProgress | null =
    caseData?.analysisStatus === "pending" && caseData.analysisProgress
      ? caseData.analysisProgress
      : null;

  const isPhotoReanalysis = Boolean(
    reanalyzingPhoto && caseData?.analysisStatus === "pending",
  );

  const requestValue = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? (progress.index / progress.total) * 100
        : undefined
      : progress.stage === "stream"
        ? Math.min((progress.received / progress.total) * 100, 100)
        : undefined
    : undefined;

  const progressDescription = useMemo(() => {
    if (progress) {
      const prefix = progress.steps
        ? `${t("stepPrefix", { step: progress.step, steps: progress.steps })} `
        : "";
      if (progress.stage === "upload") {
        return (
          prefix +
          (progress.index > 0
            ? t("uploadingProgress", {
                index: progress.index,
                total: progress.total,
                percent: Math.floor((progress.index / progress.total) * 100),
                count: progress.total,
              })
            : t("uploadingPhotos"))
        );
      }
      if (progress.stage === "retry") {
        return prefix + t("analysisRestarting", { attempt: progress.attempt });
      }
      return (
        prefix +
        (progress.done
          ? t("processingResults")
          : t("analyzingTokens", {
              received: progress.received,
              total: progress.total,
            }))
      );
    }
    if (caseData?.analysisStatus === "pending") {
      return t("analyzingPhoto");
    }
    if (caseData?.analysisStatus === "canceled") {
      return t("analysisCanceled");
    }
    return t("analysisFailed");
  }, [progress, caseData?.analysisStatus, t]);

  const value: CaseContextValue = {
    caseId,
    caseData,
    members,
    selectedPhoto,
    setSelectedPhoto,
    fileInputRef,
    refreshCase,
    updateVehicle,
    inviteMember,
    uploadFiles,
    handleUpload,
    removeMember,
    analysisActive,
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
    translate,
    progress,
    progressDescription,
    requestValue,
    isPhotoReanalysis,
  };
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCaseContext() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCaseContext must be used within CaseProvider");
  return ctx;
}

export function useOptionalCaseContext() {
  return useContext(CaseContext);
}
