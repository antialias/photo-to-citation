"use client";

import useAddFilesToCase from "@/app/useAddFilesToCase";
import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";
import { space } from "@/styleTokens";
import { useSearchParams } from "next/navigation";
import { css } from "styled-system/css";

export default function UploadPage() {
  const params = useSearchParams();
  const caseId = params.get("case");
  const addFiles = useAddFilesToCase(caseId ?? "");
  const newCase = useNewCaseFromFiles();
  const uploadCase = caseId ? addFiles : newCase;
  return (
    <div className={css({ p: space.container })}>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => uploadCase(e.target.files)}
      />
    </div>
  );
}
