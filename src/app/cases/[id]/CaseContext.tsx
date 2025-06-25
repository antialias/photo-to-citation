"use client";

import { apiEventSource, apiFetch } from "@/apiClient";
import useDragReset from "@/app/cases/useDragReset";
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
  hasViolation,
} from "@/lib/caseUtils";
import type { LlmProgress } from "@/lib/openai";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNotify } from "../../components/NotificationProvider";

export interface Member {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
}

interface CaseContextValue {
  caseData: Case | null;
  preview: string | null;
  selectedPhoto: string | null;
  setSelectedPhoto: (p: string) => void;
  plate: string;
  plateState: string;
  vin: string;
  note: string;
  photoNote: string;
  members: Member[];
  copied: boolean;
  reanalyzingPhoto: string | null;
  isAdmin: boolean;
  analysisActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  hasCamera: boolean;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  hideClaimBanner: boolean;
  setHideClaimBanner: (v: boolean) => void;
  chatExpanded: boolean;
  setChatExpanded: (v: boolean) => void;
  showClaimBanner: boolean;
  violationIdentified: boolean;
  vinOverridden: boolean;
  plateNumberOverridden: boolean;
  plateStateOverridden: boolean;
  ownerContact: string | null;
  isOwner: boolean;
  canManageMembers: boolean;
  progress: LlmProgress | null;
  isPhotoReanalysis: boolean;
  requestValue: number | undefined;
  progressDescription: string;
  updateVin: (v: string) => Promise<void>;
  clearVin: () => Promise<void>;
  updateNote: (v: string) => Promise<void>;
  updatePlateNumber: (v: string) => Promise<void>;
  updatePlateState: (v: string) => Promise<void>;
  clearPlateNumber: () => Promise<void>;
  clearPlateState: () => Promise<void>;
  togglePublic: () => Promise<void>;
  toggleClosed: () => Promise<void>;
  toggleArchived: () => Promise<void>;
  retryAnalysis: () => Promise<void>;
  removePhoto: (p: string) => Promise<void>;
  inviteMember: (uid: string) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  copyPublicUrl: () => Promise<void>;
  reanalyzePhoto: (p: string, d?: HTMLDetailsElement | null) => Promise<void>;
  updatePhotoNote: (v: string) => Promise<void>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function useCaseContext() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("CaseContext not found");
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
  children: ReactNode;
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
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<string | null>(null);
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "superadmin" ||
    initialIsAdmin;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hideClaimBanner, setHideClaimBanner] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const notify = useNotify();
  const showClaimBanner = Boolean(
    caseData?.sessionId && !session?.user && !hideClaimBanner,
  );

  useDragReset(() => {
    setDragging(false);
  });

  useEffect(() => {
    void caseId;
    setHideClaimBanner(false);
  }, [caseId]);

  useEffect(() => {
    void caseData?.sessionId;
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

  async function updateVinFn(value: string) {
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
    if (res.ok) {
      if (detailsEl) {
        detailsEl.open = false;
      }
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

  const violationIdentified =
    caseData?.analysisStatus === "complete" &&
    caseData.analysis &&
    hasViolation(caseData.analysis);
  const vinOverridden = caseData?.vinOverride !== null;
  const plateNumberOverridden =
    caseData?.analysisOverrides?.vehicle?.licensePlateNumber !== undefined;
  const plateStateOverridden =
    caseData?.analysisOverrides?.vehicle?.licensePlateState !== undefined;
  const ownerContact = caseData ? getCaseOwnerContact(caseData) : null;
  const isOwner = members.some(
    (m) => m.userId === session?.user?.id && m.role === "owner",
  );
  const canManageMembers = isAdmin || isOwner;

  const progress =
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
      : Math.min((progress.received / progress.total) * 100, 100)
    : undefined;
  const progressDescription = progress
    ? `${progress.steps ? `Step ${progress.step} of ${progress.steps}: ` : ""}${
        progress.stage === "upload"
          ? progress.index > 0
            ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor(
                (progress.index / progress.total) * 100,
              )}%)`
            : "Uploading photos..."
          : progress.done
            ? "Processing results..."
            : `Analyzing... ${progress.received} of ${progress.total} tokens`
      }`
    : caseData?.analysisStatus === "pending"
      ? "Analyzing photo..."
      : caseData?.analysisStatus === "canceled"
        ? "Analysis canceled."
        : "Analysis failed.";

  const value: CaseContextValue = {
    caseData,
    preview,
    selectedPhoto,
    setSelectedPhoto,
    plate,
    plateState,
    vin,
    note,
    photoNote,
    members,
    copied,
    reanalyzingPhoto,
    isAdmin,
    analysisActive,
    fileInputRef,
    hasCamera,
    dragging,
    setDragging,
    hideClaimBanner,
    setHideClaimBanner,
    chatExpanded,
    setChatExpanded,
    showClaimBanner,
    violationIdentified,
    vinOverridden,
    plateNumberOverridden,
    plateStateOverridden,
    ownerContact,
    isOwner,
    canManageMembers,
    progress,
    isPhotoReanalysis,
    requestValue,
    progressDescription,
    updateVin: updateVinFn,
    clearVin,
    updateNote: updateCaseNote,
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    togglePublic,
    toggleClosed,
    toggleArchived,
    retryAnalysis,
    removePhoto,
    inviteMember,
    removeMember,
    copyPublicUrl,
    reanalyzePhoto,
    updatePhotoNote,
    handleUpload,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}
