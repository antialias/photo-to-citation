"use client";
import type { Case, SentEmail, ThreadImage } from "@/lib/caseStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function buildThread(c: Case, startId: string): SentEmail[] {
  const list = c.sentEmails ?? [];
  let current = list.find((m) => m.sentAt === startId);
  if (!current) return [];
  const chain: SentEmail[] = [];
  while (current) {
    chain.unshift(current);
    current = current.replyTo
      ? list.find((m) => m.sentAt === current?.replyTo)
      : undefined;
  }
  return chain;
}

export default function ClientThreadPage({
  caseId,
  initialCase,
  startId,
}: {
  caseId: string;
  initialCase: Case | null;
  startId: string;
}) {
  const [caseData, setCaseData] = useState<Case | null>(initialCase);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${caseId}`).then(async (res) => {
      if (res.ok) {
        const data = (await res.json()) as Case;
        setCaseData(data);
      }
    });
    const es = new EventSource("/api/cases/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as Case & { deleted?: boolean };
      if (data.id !== caseId) return;
      if (data.deleted) {
        setCaseData(null);
      } else {
        setCaseData(data);
      }
    };
    return () => es.close();
  }, [caseId]);

  async function uploadScan(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const form = new FormData();
    form.append("photo", file);
    form.append("replyTo", startId);
    const uploadRes = await fetch(`/api/cases/${caseId}/thread-images`, {
      method: "POST",
      body: form,
    });
    if (!uploadRes.ok) {
      alert("Failed to upload image. Please try again.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) {
      setCaseData((await res.json()) as Case);
    } else {
      alert("Failed to refresh case data. Please retry.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function attachEvidence(url: string) {
    const res = await fetch(`/api/cases/${caseId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: url }),
    });
    if (!res.ok) {
      alert("Failed to attach evidence. Please try again.");
    }
  }

  if (!caseData) {
    return <div className="p-8">Loading...</div>;
  }

  const thread = buildThread(caseData, startId);
  const images: ThreadImage[] = (caseData.threadImages ?? []).filter(
    (i) => i.threadParent === startId,
  );

  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <Link href={`/cases/${caseId}`} className="text-blue-500 underline">
            Back to Case
          </Link>
          <h1 className="text-xl font-semibold">Thread</h1>
        </div>
        <div className="flex gap-2 items-center">
          <label className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer">
            Upload Scan
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={uploadScan}
              className="hidden"
            />
          </label>
          <Link
            href={`/cases/${caseId}/thread/${encodeURIComponent(startId)}?followup=1`}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Follow Up
          </Link>
        </div>
      </div>
      <ul className="flex flex-col gap-4">
        {thread.map((mail) => (
          <li key={mail.sentAt} className="border p-2 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(mail.sentAt).toLocaleString()} - To: {mail.to}
            </div>
            <div className="font-semibold">{mail.subject}</div>
            <pre className="whitespace-pre-wrap text-sm">{mail.body}</pre>
          </li>
        ))}
        {images.map((img) => (
          <li key={img.id} className="border p-2 rounded flex gap-2">
            <Image
              src={img.url}
              alt="scan"
              width={150}
              height={100}
              className="object-contain cursor-pointer"
              onClick={() => setViewImage(img.url)}
            />
            <div className="flex flex-col gap-2 flex-1">
              <button
                type="button"
                onClick={() => attachEvidence(img.url)}
                className="self-start bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
              >
                Add as Evidence
              </button>
              {img.ocrText ? (
                <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {img.ocrText}
                </pre>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {viewImage ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded shadow max-w-3xl w-full">
            <div className="relative w-full h-[80vh]">
              <Image
                src={viewImage}
                alt="scan full size"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setViewImage(null)}
                className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
