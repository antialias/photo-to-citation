"use client";

import useNewCaseFromFiles from "@/app/useNewCaseFromFiles";

export default function UploadPage() {
  const uploadCase = useNewCaseFromFiles();
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
