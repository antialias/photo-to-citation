"use client";

import { apiEventSource, apiFetch } from "@/apiClient";
import useCaseAnalysisActive from "@/app/useCaseAnalysisActive";
import { useSession } from "@/app/useSession";
import { withBasePath } from "@/basePath";
import type { Case } from "@/lib/caseStore";
import {
  getCaseOwnerContact,
  getCasePlateNumber,
  getCasePlateState,
  getCaseVin,
  getRepresentativePhoto,
} from "@/lib/caseUtils";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNotify } from "../../../components/NotificationProvider";

interface CaseMember {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
}

interface CaseContextValue {
  caseId: string;
  readOnly: boolean;
  caseData: Case | null;
  selectedPhoto: string | null;
  setSelectedPhoto: (p: string | null) => void;
  members: CaseMember[];
  inviteUserId: string;
  setInviteUserId: (v: string) => void;
  photoNote: string;
  analysisActive: boolean;
  isAdmin: boolean;
  sessionUserId: string | undefined;
  fileInputRef: React.RefObject<HTMLInputElement>;
  hasCamera: boolean;
  uploadFiles: (files: FileList) => Promise<void>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  updatePlateNumber: (value: string) => Promise<void>;
  updatePlateState: (value: string) => Promise<void>;
  clearPlateNumber: () => Promise<void>;
  clearPlateState: () => Promise<void>;
  updateVin: (value: string) => Promise<void>;
  clearVin: () => Promise<void>;
  updateCaseNote: (value: string) => Promise<void>;
  updatePhotoNote: (value: string) => Promise<void>;
  togglePublic: () => Promise<void>;
  toggleClosed: () => Promise<void>;
  toggleArchived: () => Promise<void>;
  copyPublicUrl: () => Promise<void>;
  reanalyzePhoto: (
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) => Promise<void>;
  retryAnalysis: () => Promise<void>;
  removePhoto: (photo: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  inviteMember: () => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  plate: string;
  plateState: string;
  vin: string;
  note: string;
  setChatExpanded: (v: boolean) => void;
  chatExpanded: boolean;
  copied: boolean;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  hideClaimBanner: boolean;
  setHideClaimBanner: (v: boolean) => void;
  preview: string | null;
  reanalyzingPhoto: string | null;
  setReanalyzingPhoto: (p: string | null) => void;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function useCaseContext() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCaseContext must be used within CaseProvider");
  return ctx;
}

export function CaseProvider({
  initialCase,
  caseId,
  initialIsAdmin = false,
  readOnly = false,
  children,
}: {
  initialCase: Case | null;
  caseId: string;
  initialIsAdmin?: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  const [caseData, setCaseData] = useState<Case | null>(initialCase);
  const analysisActive = useCaseAnalysisActive(
    caseId,
    caseData?.public ?? false,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    initialCase ? getRepresentativePhoto(initialCase) : null,
  );
  const [plate, setPlate] = useState<string>(
    initialCase ? getCasePlateNumber(initialCase) || "" : "",
  );
  const [plateState, setPlateState] = useState<string>(
    initialCase ? getCasePlateState(initialCase) || "" : "",
  );
  const [vin, setVin] = useState<string>(
    initialCase ? getCaseVin(initialCase) || "" : "",
  );
  const [note, setNote] = useState<string>(initialCase?.note || "");
  const [photoNote, setPhotoNote] = useState<string>("");
  const [members, setMembers] = useState<CaseMember[]>([]);
  const [inviteUserId, setInviteUserId] = useState("");
  const [copied, setCopied] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<string | null>(null);
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "superadmin" ||
    initialIsAdmin;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hideClaimBanner, setHideClaimBanner] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    setHideClaimBanner(false);
  }, []);

  useEffect(() => {
    if (!caseData?.sessionId) {
      setHideClaimBanner(false);
    }
  }, [caseData?.sessionId]);

  useEffect(() => {
    if (
      "mediaDevices" in navigator &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      setHasCamera(true);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(`preview-${caseId}`);
    if (stored) setPreview(stored);
    apiFetch(`/api/cases/${caseId}`).then(async (res) => {
      if (res.ok) {
        const data = (await res.json()) as Case;
        setCaseData(data);
      }
    });
    apiFetch(`/api/cases/${caseId}/members`).then(async (res) => {
      if (res.ok) setMembers(await res.json());
    });
    const es = apiEventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case & { deleted?: boolean };
      if (data.id !== caseId) return;
      if (data.deleted) {
        setCaseData(null);
      } else {
        setCaseData(data);
        sessionStorage.removeItem(`preview-${caseId}`);
      }
    };
    return () => es.close();
  }, [caseId]);

  useEffect(() => {
    if (caseData) {
      setPlate(getCasePlateNumber(caseData) || "");
      setPlateState(getCasePlateState(caseData) || "");
      setVin(getCaseVin(caseData) || "");
      setNote(caseData.note || "");
      setSelectedPhoto((prev) => {
        const all = new Set<string>([
          ...caseData.photos,
          ...(caseData.threadImages ?? []).map((img) => img.url),
        ]);
        return prev && all.has(prev) ? prev : getRepresentativePhoto(caseData);
      });
    }
  }, [caseData]);

  useEffect(() => {
    if (caseData && selectedPhoto) {
      setPhotoNote(caseData.photoNotes?.[selectedPhoto] || "");
    }
  }, [caseData, selectedPhoto]);

  useEffect(() => {
    if (caseData?.analysisStatus !== "pending") {
      setReanalyzingPhoto(null);
    }
  }, [caseData?.analysisStatus]);

  async function uploadFiles(files: FileList) {
    if (!files || files.length === 0) return;
    const results = await Promise.all(
      Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caseId", caseId);
        return apiFetch("/api/upload", { method: "POST", body: formData });
      }),
    );
    if (results.some((r) => !r.ok)) {
      notify("Failed to upload one or more files.");
      return;
    }
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    } else {
      notify("Failed to refresh case after upload.");
    }
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) await uploadFiles(files);
  }

  async function refreshCase() {
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (res.ok) {
      const data = (await res.json()) as Case;
      setCaseData(data);
    } else {
      notify("Failed to refresh case.");
    }
  }

  async function updateVehicle(plateNum: string, plateSt: string) {
    const res = await apiFetch(`/api/cases/${caseId}/override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: {
          licensePlateNumber: plateNum || undefined,
          licensePlateState: plateSt || undefined,
        },
      }),
    });
    if (!res.ok) {
      notify("Failed to update vehicle information.");
      return;
    }
    await refreshCase();
  }

  async function updatePlateNumber(value: string) {
    setPlate(value);
    await updateVehicle(value, plateState);
  }

  async function updatePlateState(value: string) {
    setPlateState(value);
    await updateVehicle(plate, value);
  }

  async function clearPlateNumber() {
    setPlate("");
    await updateVehicle("", plateState);
  }

  async function clearPlateState() {
    setPlateState("");
    await updateVehicle(plate, "");
  }

  async function updateVin(value: string) {
    setVin(value);
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
    setVin("");
    const res = await apiFetch(`/api/cases/${caseId}/vin`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify("Failed to clear VIN.");
      return;
    }
    await refreshCase();
  }

  async function updateCaseNote(value: string) {
    setNote(value);
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

  async function updatePhotoNote(value: string) {
    if (!selectedPhoto) return;
    setPhotoNote(value);
    const res = await apiFetch(`/api/cases/${caseId}/photo-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: selectedPhoto, note: value || null }),
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
    if (!res.ok) {
      notify("Failed to reanalyze photo.");
    } else if (detailsEl) {
      detailsEl.open = false;
    }
    await refreshCase();
  }

  async function retryAnalysis() {
    if (caseData) setCaseData({ ...caseData, analysisStatus: "pending" });
    const res = await apiFetch(`/api/cases/${caseId}/reanalyze`, {
      method: "POST",
    });
    if (!res.ok) {
      notify("Failed to retry analysis.");
    }
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

  async function refreshMembers() {
    const res = await apiFetch(`/api/cases/${caseId}/members`);
    if (res.ok) setMembers(await res.json());
  }

  async function inviteMember() {
    if (!inviteUserId) return;
    const res = await apiFetch(`/api/cases/${caseId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: inviteUserId }),
    });
    if (!res.ok) {
      notify("Failed to invite collaborator.");
      return;
    }
    setInviteUserId("");
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

  const value: CaseContextValue = {
    caseId,
    readOnly,
    caseData,
    selectedPhoto,
    setSelectedPhoto,
    members,
    inviteUserId,
    setInviteUserId,
    photoNote,
    analysisActive,
    isAdmin,
    sessionUserId: session?.user?.id,
    fileInputRef,
    hasCamera,
    uploadFiles,
    handleUpload,
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    updateVin,
    clearVin,
    updateCaseNote,
    updatePhotoNote,
    togglePublic,
    toggleClosed,
    toggleArchived,
    copyPublicUrl,
    reanalyzePhoto,
    retryAnalysis,
    removePhoto,
    refreshMembers,
    inviteMember,
    removeMember,
    plate,
    plateState,
    vin,
    note,
    setChatExpanded,
    chatExpanded,
    copied,
    dragging,
    setDragging,
    hideClaimBanner,
    setHideClaimBanner,
    preview,
    reanalyzingPhoto,
    setReanalyzingPhoto,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}
