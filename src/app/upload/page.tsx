'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  return (
    <form
      className="flex flex-col gap-4 p-8"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!file) return
        const formData = new FormData()
        formData.append('photo', file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          router.push(`/cases/${data.caseId}`)
        }
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="submit"
        className="rounded border bg-black text-white px-4 py-2"
      >
        Upload Photo
      </button>
    </form>
  )
}
