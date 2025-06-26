"use client";

import useAddFilesToCase from "@/app/useAddFilesToCase";
import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import { useSearchParams } from "next/navigation";

export default function UploadPage() {
  const params = useSearchParams();
  const caseId = params.get("case");
  const addFilesToCase = useAddFilesToCase(caseId ?? "");
  const newCase = useNewCaseFromFiles();
  const uploadCase = caseId ? addFilesToCase : newCase;
  return (
    <div className="p-8">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => uploadCase(e.target.files)}
      />
    </div>
  );
}
