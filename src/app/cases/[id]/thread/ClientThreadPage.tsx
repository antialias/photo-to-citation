"use client";
import { apiFetch } from "@/apiClient";
import ThumbnailImage from "@/components/thumbnail-image";
import type { Case, SentEmail, ThreadImage } from "@/lib/caseStore";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { useNotify } from "../../../components/NotificationProvider";
import useCase, { caseQueryKey } from "../../../hooks/useCase";
import useEventSource from "../../../hooks/useEventSource";

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
  const queryClient = useQueryClient();
  const { data: caseData } = useCase(caseId, initialCase);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();
  const { t } = useTranslation();

  useEventSource<Case & { deleted?: boolean }>("/api/cases/stream", (data) => {
    if (data.id !== caseId) return;
    if (data.deleted) {
      queryClient.setQueryData(caseQueryKey(caseId), null);
    } else {
      queryClient.setQueryData(caseQueryKey(caseId), data);
    }
  });

  async function uploadScan(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const form = new FormData();
    form.append("photo", file);
    form.append("replyTo", startId);
    const uploadRes = await apiFetch(`/api/cases/${caseId}/thread-images`, {
      method: "POST",
      body: form,
    });
    if (!uploadRes.ok) {
      notify(t("failedImageUpload"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    queryClient.invalidateQueries({ queryKey: caseQueryKey(caseId) });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function attachEvidence(url: string) {
    const res = await apiFetch(`/api/cases/${caseId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: url }),
    });
    if (!res.ok) {
      notify(t("failedAttachEvidence"));
    }
  }

  if (!caseData) {
    return <div className="p-8">{t("loading")}</div>;
  }

  const thread = buildThread(caseData, startId);
  const images: ThreadImage[] = (caseData.threadImages ?? []).filter(
    (i) => i.threadParent === startId,
  );

  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="sticky top-14 bg-white dark:bg-gray-900 flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/cases/${caseId}`}
            aria-label={t("backToCase")}
            className="text-xl p-2 text-blue-500 hover:text-blue-700"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-xl font-semibold">{t("thread")}</h1>
        </div>
        <div className="flex gap-2 items-center">
          <label className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer">
            {t("uploadScan")}
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
            {t("followUp")}
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
            {mail.snailMailStatus ? (
              <div className="text-sm">
                {t(
                  mail.snailMailStatus === "queued"
                    ? "snailMailQueued"
                    : mail.snailMailStatus === "saved"
                      ? "snailMailSaved"
                      : mail.snailMailStatus === "shortfall"
                        ? "snailMailShortfall"
                        : "snailMailError",
                )}
              </div>
            ) : null}
            {mail.attachments && mail.attachments.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1">
                <span className="font-semibold">{t("attachments")}</span>
                <ul className="flex gap-2 flex-wrap">
                  {mail.attachments.map((att) => (
                    <li key={att}>
                      <a
                        href={`/uploads/${att}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ThumbnailImage
                          src={getThumbnailUrl(att, 128)}
                          alt="attachment"
                          width={96}
                          height={72}
                          imgClassName="object-contain"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
        {images.map((img) => (
          <li key={img.id} className="border p-2 rounded flex gap-2">
            <ThumbnailImage
              src={getThumbnailUrl(img.url, 256)}
              alt="scan"
              width={150}
              height={100}
              className="cursor-pointer"
              imgClassName="object-contain"
              onClick={() => setViewImage(`/uploads/${img.url}`)}
            />
            <div className="flex flex-col gap-2 flex-1">
              <button
                type="button"
                onClick={() => attachEvidence(img.url)}
                className="self-start bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
              >
                {t("addAsEvidence")}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white dark:bg-gray-900 rounded shadow max-w-3xl w-full">
            <div className="relative w-full h-[80vh]">
              <img
                src={viewImage}
                alt="scan full size"
                className="object-contain absolute inset-0 w-full h-full"
                loading="lazy"
              />
            </div>
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setViewImage(null)}
                className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
