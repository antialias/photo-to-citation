"use client";

import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const id = Date.now().toString()
    const preview = URL.createObjectURL(file)
    sessionStorage.setItem(`preview-${id}`, preview)
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('caseId', id)
    fetch('/api/upload', { method: 'POST', body: formData }).then(() => {
      sessionStorage.removeItem(`preview-${id}`)
    })
    router.push(`/cases/${id}`)
  }

  return (
    <div className="p-8">
      <input type="file" accept="image/*" onChange={handleChange} />
    </div>
  )
}
