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
      const data = JSON.parse(e.data) as Case;
      if (data.id === caseId) {
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
    await fetch(`/api/cases/${caseId}/thread-images`, {
      method: "POST",
      body: form,
    });
    const res = await fetch(`/api/cases/${caseId}`);
    if (res.ok) setCaseData((await res.json()) as Case);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function attachEvidence(url: string) {
    await fetch(`/api/cases/${caseId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: url }),
    });
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
      <div className="sticky top-0 bg-white z-10 flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <Link href={`/cases/${caseId}`} className="text-blue-500 underline">
            Back to Case
          </Link>
          <h1 className="text-xl font-semibold">Thread</h1>
        </div>
        <div className="flex gap-2 items-center">
          <label className="bg-gray-200 px-2 py-1 rounded cursor-pointer">
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
            <div className="text-sm text-gray-500">
              {new Date(mail.sentAt).toLocaleString()} - To: {mail.to}
            </div>
            <div className="font-semibold">{mail.subject}</div>
            <pre className="whitespace-pre-wrap text-sm">{mail.body}</pre>
          </li>
        ))}
        {images.map((img) => (
          <li key={img.id} className="border p-2 rounded flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Image
                src={img.url}
                alt="scan"
                width={300}
                height={200}
                className="object-contain"
              />
              {img.ocrText ? (
                <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded">
                  {img.ocrText}
                </pre>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => attachEvidence(img.url)}
              className="self-start bg-gray-200 px-2 py-1 rounded"
            >
              Add as Evidence
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
