"use client";
import DebugWrapper from "@/app/components/DebugWrapper";
import ThumbnailImage from "@/components/thumbnail-image";
import type { Case } from "@/lib/caseStore";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { baseName, buildThreads } from "../utils";

export default function CaseExtraInfo({
  caseId,
  caseData,
  selectedPhoto,
  setSelectedPhoto,
}: {
  caseId: string;
  caseData: Case;
  selectedPhoto: string | null;
  setSelectedPhoto: (photo: string) => void;
}) {
  const analysisImages = caseData.analysis?.images ?? {};
  const paperworkScans = (caseData.threadImages ?? []).map((img) => ({
    url: img.url,
    time: img.uploadedAt,
  }));
  const paperworkPhotos = caseData.photos.filter(
    (p) => analysisImages[baseName(p)]?.paperwork,
  );
  const allPaperwork = [
    ...paperworkPhotos.map((p) => ({ url: p, time: caseData.photoTimes[p] })),
    ...paperworkScans,
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {caseData.sentEmails && caseData.sentEmails.length > 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">Email Log</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {buildThreads(caseData).map((mail) => (
              <li
                key={mail.sentAt}
                id={`email-${mail.sentAt}`}
                className="flex flex-col gap-1"
              >
                <span>
                  {new Date(mail.sentAt).toLocaleString()} - {mail.subject}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  To: {mail.to}
                </span>
                <span className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                  {mail.body}
                </span>
                <a
                  href={`/cases/${caseId}/thread/${encodeURIComponent(mail.sentAt)}`}
                  className="self-start text-blue-500 underline"
                >
                  View Thread
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {allPaperwork.length > 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">Paperwork</h2>
          <div className="flex gap-2 flex-wrap">
            {allPaperwork.map(({ url, time }) => {
              const info = {
                url,
                time,
                analysis: analysisImages[baseName(url)] ?? null,
              };
              return (
                <DebugWrapper key={url} data={info}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(url)}
                      className={
                        selectedPhoto === url
                          ? "ring-2 ring-blue-500"
                          : "ring-1 ring-transparent"
                      }
                    >
                      <div className="relative w-20 aspect-[4/3]">
                        <ThumbnailImage
                          src={getThumbnailUrl(url, 128)}
                          alt="paperwork"
                          width={80}
                          height={60}
                          imgClassName="object-contain"
                        />
                      </div>
                      {time ? (
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                          {new Date(time).toLocaleDateString()}
                        </span>
                      ) : null}
                    </button>
                  </div>
                </DebugWrapper>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
