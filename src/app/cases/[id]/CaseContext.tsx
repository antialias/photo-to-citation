"use client";

import { apiEventSource, apiFetch } from "@/apiClient";
import type { Case } from "@/lib/caseStore";
import { getRepresentativePhoto } from "@/lib/caseUtils";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNotify } from "../../components/NotificationProvider";

interface CaseMember {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
}

interface CaseContextValue {
  caseId: string;
  caseData: Case | null;
  setCaseData: React.Dispatch<React.SetStateAction<Case | null>>;
  members: CaseMember[];
  selectedPhoto: string | null;
  setSelectedPhoto: React.Dispatch<React.SetStateAction<string | null>>;
  fileInputRef: React.RefObject<HTMLInputElement> | null;
  refreshCase: () => Promise<void>;
  updateVehicle: (plateNum: string, plateState: string) => Promise<void>;
  inviteMember: (userId: string) => Promise<void>;
  uploadFiles: (files: FileList) => Promise<void>;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
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
  const [caseData, setCaseData] = useState<Case | null>(initialCase);
  const [members, setMembers] = useState<CaseMember[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    initialCase ? getRepresentativePhoto(initialCase) : null,
  );
  const notify = useNotify();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    apiFetch(`/api/cases/${caseId}`).then(async (res) => {
      if (res.ok) setCaseData((await res.json()) as Case);
    });
    apiFetch(`/api/cases/${caseId}/members`).then(async (res) => {
      if (res.ok) setMembers(await res.json());
    });
    const es = apiEventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case & { deleted?: boolean };
      if (data.id !== caseId) return;
      if (data.deleted) setCaseData(null);
      else {
        setCaseData(data);
        sessionStorage.removeItem(`preview-${caseId}`);
      }
    };
    return () => es.close();
  }, [caseId]);

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
    if (res.ok) {
      setCaseData((await res.json()) as Case);
    } else {
      notify("Failed to refresh case.");
    }
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

  const value: CaseContextValue = {
    caseId,
    caseData,
    setCaseData,
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
  };
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCaseContext() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCaseContext must be used within CaseProvider");
  return ctx;
}
