"use client";
import DebugWrapper from "@/app/components/DebugWrapper";
import ThumbnailImage from "@/components/thumbnail-image";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaFileAlt, FaFilePdf } from "react-icons/fa";
import { useCaseContext } from "../CaseContext";
import { baseName, buildThreads } from "../utils";

export default function CaseExtraInfo({ caseId }: { caseId: string }) {
  const { caseData, selectedPhoto, setSelectedPhoto } = useCaseContext();
  const { t } = useTranslation();
  if (!caseData) return null;
  const hasSnail = (caseData.sentEmails ?? []).some((m) => m.snailMailStatus);
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
          <h2 className="font-semibold flex items-center gap-2">
            {t("emailLog")}
            {hasSnail && (
              <Link
                href={`/snail-mail?case=${caseId}`}
                className="text-blue-500 underline text-sm"
              >
                {t("viewSnailMail")}
              </Link>
            )}
          </h2>
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
                  {t("to")} {mail.to}
                </span>
                <span className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                  {mail.body}
                </span>
                {mail.attachments && mail.attachments.length > 0 ? (
                  <ul className="flex flex-wrap gap-2 mt-1">
                    {mail.attachments.map((att) => {
                      const ext = att.toLowerCase().split(".").pop() ?? "";
                      const isImage = [
                        "jpg",
                        "jpeg",
                        "png",
                        "webp",
                        "gif",
                      ].includes(ext);
                      const isPdf = ext === "pdf";
                      return (
                        <li key={att}>
                          <a
                            href={`/uploads/${att}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            {isImage ? (
                              <ThumbnailImage
                                src={getThumbnailUrl(att, 128)}
                                alt={att}
                                width={64}
                                height={48}
                                imgClassName="object-contain"
                              />
                            ) : isPdf ? (
                              <FaFilePdf className="w-8 h-8 text-red-600" />
                            ) : (
                              <FaFileAlt className="w-8 h-8" />
                            )}
                            <span className="text-blue-500 underline">
                              {att}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <a
                  href={`/cases/${caseId}/thread/${encodeURIComponent(mail.sentAt)}`}
                  className="self-start text-blue-500 underline"
                >
                  {t("viewThread")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {allPaperwork.length > 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded flex flex-col gap-2">
          <h2 className="font-semibold">{t("paperwork")}</h2>
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
                          alt={t("paperwork")}
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
