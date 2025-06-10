"use client";

import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const id = Date.now().toString();
    const preview = URL.createObjectURL(files[0]);
    sessionStorage.setItem(`preview-${id}`, preview);
    Array.from(files).forEach((file, idx) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("caseId", id);
      const upload = fetch("/api/upload", { method: "POST", body: formData });
      if (idx === 0) {
        upload.then(() => {
          sessionStorage.removeItem(`preview-${id}`);
        });
      }
    });
    router.push(`/cases/${id}`);
  }

  return (
    <div className="p-8">
      <input type="file" accept="image/*" multiple onChange={handleChange} />
    </div>
  );
}
